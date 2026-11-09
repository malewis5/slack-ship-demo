import { setTimeout as sleep } from 'node:timers/promises';
import { Redis } from '@upstash/redis';
import { getToken } from '@vercel/connect';
import { conversationSchema, defaultConversations, normalizeTrigger } from './conversations';
import type { Conversation } from './conversations';
import { buildConversationMessage, slackCall } from './demo-runner.mjs';
import { primaryTarget, slackTargets } from './slack-targets.mjs';

export type SlackTarget = { connector: string; appId: string; team: string; channel: string };

// A kickoff comes from a person (`user`) or an automation such as a Workflow
// Builder step (`bot_id`, often without `user`).
export type DemoTrigger = { scene: string; channel: string; ts: string; user?: string; bot_id?: string };
type Receipt = { channel: string; ts: string; thread_ts: string };
type Progress = {
  status: 'running' | 'complete' | 'needs-review';
  receipts: Receipt[];
  pending?: number;
};
type Store = {
  set(key: string, value: Progress, options?: { nx: true }): Promise<unknown>;
};
type CallOptions = { fetchFn: typeof fetch; wait: (ms: number) => Promise<void> };
type Options = {
  store?: Store;
  getToken?: typeof getToken;
  call?: (token: string, method: string, body: Record<string, unknown>, options: CallOptions) => Promise<{ data: unknown }>;
  fetchFn?: typeof fetch;
  wait?: (ms: number, signal: AbortSignal) => Promise<void>;
  signal?: AbortSignal;
  conversation?: Conversation;
  target?: SlackTarget;
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

// Either sender field, when present, must be well formed; at least one is required.
function validSender(value: Record<string, unknown>): boolean {
  return ('user' in value ? typeof value.user === 'string' && /^U[A-Z0-9]+$/.test(value.user) : 'bot_id' in value)
    && (!('bot_id' in value) || (typeof value.bot_id === 'string' && /^B[A-Z0-9]+$/.test(value.bot_id)));
}

// `pnpm demo` posts kickoff lines through the demo apps and then plays the thread
// itself, so a configured app's own messages must never start a second thread.
function fromDemoApp(message: Record<string, unknown>, target: SlackTarget): boolean {
  const ids = [message.app_id, record(message.bot_profile)?.app_id];
  return [target, ...slackTargets].some((app) => ids.includes(app.appId));
}

function validTrigger(value: unknown, conversation: Conversation | undefined, target: SlackTarget): value is DemoTrigger & Record<string, unknown> {
  const event = record(value);
  return !!event && !!conversation && event.scene === conversation.id && conversation.enabled
    && validSender(event)
    && typeof event.channel === 'string' && event.channel === target.channel
    && /^C[A-Z0-9]+$/.test(event.channel)
    && typeof event.ts === 'string' && /^\d+\.\d+$/.test(event.ts);
}

export function isDemoMessageCandidate(event: unknown, target: SlackTarget = primaryTarget): boolean {
  const message = record(event);
  return !!message && message.type === 'message'
    && message.channel_type === 'channel'
    && !['hidden', 'thread_ts', 'edited'].some((key) => key in message)
    // Automations post with `bot_id`, and usually `app_id` or the `bot_message` subtype.
    && (!('subtype' in message) || message.subtype === 'bot_message')
    && (!('app_id' in message) || (typeof message.app_id === 'string' && /^A[A-Z0-9]+$/.test(message.app_id)))
    && validSender(message) && !fromDemoApp(message, target)
    && typeof message.text === 'string'
    && typeof message.channel === 'string' && message.channel === target.channel
    && /^C[A-Z0-9]+$/.test(message.channel)
    && typeof message.ts === 'string' && /^\d+\.\d+$/.test(message.ts);
}

export function matchDemoTrigger(
  event: unknown,
  conversations: Conversation[] = defaultConversations,
  target: SlackTarget = primaryTarget,
): DemoTrigger | null {
  if (!isDemoMessageCandidate(event, target)) return null;
  const message = record(event)!;
  const conversation = conversations.find((item) => item.enabled
    && normalizeTrigger(item.trigger) === normalizeTrigger(message.text as string));
  const trigger = {
    scene: conversation?.id, channel: message.channel, ts: message.ts,
    ...('user' in message ? { user: message.user } : {}),
    ...('bot_id' in message ? { bot_id: message.bot_id } : {}),
  };
  return validTrigger(trigger, conversation, target) ? trigger : null;
}

export async function runDemoReplies(trigger: DemoTrigger, options: Options = {}): Promise<void> {
  const target = options.target ?? primaryTarget;
  const selected = options.conversation ?? defaultConversations.find((item) => item.id === trigger?.scene);
  if (!selected || !conversationSchema.safeParse(selected).success || !validTrigger(trigger, selected, target)) {
    throw new Error('Invalid demo trigger.');
  }
  const { channel, ts } = trigger;
  const deadline = AbortSignal.timeout(45_000);
  const signal = options.signal ? AbortSignal.any([deadline, options.signal]) : deadline;
  // Also bound APIs without signal support (Connect). Late results never advance the worker.
  function bounded<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const abort = (): void => reject(new Error('Demo deadline exceeded.'));
      if (signal.aborted) return abort();
      signal.addEventListener('abort', abort, { once: true });
      Promise.resolve().then(() => {
        signal.throwIfAborted();
        return operation();
      }).then((value) => {
        signal.throwIfAborted();
        resolve(value);
      }).catch(reject).finally(() => signal.removeEventListener('abort', abort));
    });
  }

  const key = `dreamforce:demo-trigger:${target.team}:${channel}:${ts}`;
  let store: Store | undefined;
  let claimed = false;
  const progress: Progress = { status: 'running', receipts: [] };
  const save = async (): Promise<void> => {
    if (await bounded(() => store!.set(key, progress)) !== 'OK') throw new Error('Demo storage failed.');
  };
  try {
    signal.throwIfAborted();
    store = options.store ?? Redis.fromEnv({
      retry: false,
      signal: () => AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
      enableTelemetry: false,
    });
    const claim = await bounded(() => store!.set(key, progress, { nx: true }));
    if (claim === null) return;
    if (claim !== 'OK') throw new Error('Demo storage failed.');
    claimed = true;
    const token = await bounded(() => (options.getToken ?? getToken)(target.connector, {
      subject: { type: 'app' }, installationId: target.team,
    }));
    const wait = <T = void>(ms = 1, value?: T): Promise<T> => bounded(async () => {
      if (options.wait) {
        await options.wait(ms, signal);
        return value as T;
      }
      return sleep<T>(ms, value, { signal });
    });
    const fetchFn: typeof fetch = (url, init) => bounded(() => (options.fetchFn ?? fetch)(url, {
      ...init,
      signal: AbortSignal.any([signal, init?.signal ?? AbortSignal.timeout(15_000)]),
    }));
    const call = (method: string, body: Record<string, unknown>): Promise<{ data: unknown }> =>
      bounded(async () => {
        const result = await (options.call ?? slackCall)(token, method, body, { fetchFn, wait });
        if (!result) throw new Error('Missing Slack response.');
        return result;
      });
    // Events do not always carry an app ID, so confirm a bot kickoff is not this app's own post.
    if (trigger.bot_id) {
      const { data: self } = await call('auth.test', {});
      if (record(self)?.bot_id === trigger.bot_id) {
        progress.status = 'complete';
        await save();
        return;
      }
    }
    const { data: info } = await call('conversations.info', { channel });
    const threadChannel = record(record(info)?.channel);
    if (!threadChannel || threadChannel.id !== channel || threadChannel.is_private !== false
      || threadChannel.is_archived !== false) throw new Error('Demo channel unavailable.');

    const replies = selected.replies;
    for (const [index, line] of replies.entries()) {
      // Durable uncertainty marker BEFORE sending: even a killed process must not replay.
      progress.status = 'needs-review';
      progress.pending = index;
      await save();
      const member = selected.members.find((item) => item.id === line.memberId)!;
      const { data } = await call('chat.postMessage', buildConversationMessage({
        name: member.name, emoji: member.emoji, text: line.text,
      }, ts, channel));
      const receipt = record(data);
      if (!receipt || typeof receipt.ts !== 'string' || !/^\d+\.\d+$/.test(receipt.ts)
        || receipt.channel !== channel || record(receipt.message)?.thread_ts !== ts)
        throw new Error('Unexpected demo receipt.');
      progress.receipts.push({ channel, ts: receipt.ts, thread_ts: ts });
      delete progress.pending;
      progress.status = index === replies.length - 1 ? 'complete' : 'running';
      await save();
      if (index < replies.length - 1) await wait(3_000);
    }
  } catch {
    // Never delete the claim or retry a post. If KV/deadline prevents this write,
    // the last durable claim/pending marker still blocks all future deliveries.
    if (claimed && !signal.aborted) {
      progress.status = 'needs-review';
      try { await save(); } catch { /* Fail closed with the existing durable record. */ }
    }
    throw new Error('Demo replies failed; inspect stored delivery state before retrying.');
  }
}
