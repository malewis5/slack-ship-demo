import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import demoConfig from '../demo.config.json' with { type: 'json' };
import { scenes } from '../scripts/demo-scenes.mjs';

const second = { connector: 'slack/second-agent', appId: 'ASECONDAPP', teamId: 'TSECONDTEAM', channel: 'CSECONDCHAN' };
// Configure before any module reads process.env.
process.env.SLACK_EXTRA_TARGETS = JSON.stringify([second]);

const verify = mock.fn(async () => true);
const getToken = mock.fn(async () => 'test-token');
const runDemoReplies = mock.fn(async () => {});
const tasks = [];
const real = await import('../lib/demo-trigger.ts');
const { defaultConversations } = await import('../lib/conversations.ts');
mock.module(new URL('../lib/demo-trigger.ts', import.meta.url).href, {
  namedExports: { isDemoMessageCandidate: real.isDemoMessageCandidate, matchDemoTrigger: real.matchDemoTrigger, runDemoReplies },
});
mock.module(new URL('../lib/conversation-store.ts', import.meta.url).href, {
  namedExports: { listConversations: async () => structuredClone(defaultConversations) },
});
mock.module(new URL('../lib/lead-store.ts', import.meta.url).href, { namedExports: { getLead: async () => null } });
mock.module('@vercel/connect', { namedExports: { getToken } });
mock.module('@vercel/connect/chat', { namedExports: { createConnectWebhookVerifier: () => verify } });
mock.module('next/server.js', { namedExports: { after: (callback) => tasks.push(callback) } });
const { loadSlackTargets, findSlackTarget, slackTargets } = await import('../lib/slack-targets.mjs');
const { POST } = await import('../app/triggers/slack/route.ts');

const secondTarget = { connector: second.connector, appId: second.appId, team: second.teamId, channel: second.channel };
const kickoff = (target) => ({
  type: 'event_callback', api_app_id: target.appId, team_id: target.team, event_id: 'Ev1',
  event: {
    type: 'message', channel_type: 'channel', channel: target.channel,
    user: 'UPRESENTER', ts: '1789000000.123456', text: scenes.seed[0].text,
  },
});
const post = (body) => POST(new Request('https://demo.example/triggers/slack', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}));

test('primary target keeps the single-app variables and extras are appended', () => {
  assert.equal(slackTargets.length, 2);
  assert.deepEqual(slackTargets[0], {
    connector: 'slack/demo-agent', appId: demoConfig.slackAppId,
    team: demoConfig.slackTeamId, channel: demoConfig.slackChannel,
  });
  assert.deepEqual(slackTargets[1], secondTarget);
  assert.deepEqual(findSlackTarget(second.appId, second.teamId), secondTarget);
  assert.equal(findSlackTarget(second.appId, demoConfig.slackTeamId), null, 'app and workspace must match together');
});

test('invalid or duplicate extras are ignored without breaking the primary target', (t) => {
  t.mock.method(console, 'error', () => {});
  for (const raw of ['{bad', '{}', JSON.stringify([{ ...second, channel: 'not-a-channel' }])]) {
    assert.equal(loadSlackTargets({ SLACK_EXTRA_TARGETS: raw }).length, 1);
  }
  const primaryDup = { ...second, appId: demoConfig.slackAppId, teamId: demoConfig.slackTeamId };
  assert.equal(loadSlackTargets({ SLACK_EXTRA_TARGETS: JSON.stringify([primaryDup, second, second]) }).length, 2);
  assert.equal(loadSlackTargets({}).length, 1);
});

test('kickoff in the second workspace schedules replies on the second target', async () => {
  for (const target of slackTargets) {
    tasks.length = 0;
    runDemoReplies.mock.resetCalls();
    const response = await post(kickoff(target));
    assert.equal(response.status, 200);
    assert.equal(tasks.length, 1);
    await tasks[0]();
    assert.equal(runDemoReplies.mock.callCount(), 1);
    const [trigger, options] = runDemoReplies.mock.calls[0].arguments;
    assert.equal(trigger.channel, target.channel);
    assert.deepEqual(options.target, target);
  }
});

test('a target accepts kickoffs from any channel the app is in', async () => {
  tasks.length = 0;
  const crossed = kickoff(secondTarget);
  crossed.event.channel = demoConfig.slackChannel;
  assert.equal((await post(crossed)).status, 200);
  assert.equal(tasks.length, 1);
  tasks.length = 0;
});

test('unknown apps and workspaces are still rejected', async () => {
  const unknown = kickoff({ ...secondTarget, appId: 'AUNKNOWN' });
  assert.equal((await post(unknown)).status, 403);
  const mixed = kickoff({ ...secondTarget, team: demoConfig.slackTeamId });
  assert.equal((await post(mixed)).status, 403);
});

test('runDemoReplies uses the second connector, workspace and channel', async () => {
  const conversation = defaultConversations.find((item) => item.id === 'seed');
  const trigger = real.matchDemoTrigger(kickoff(secondTarget).event, defaultConversations, secondTarget);
  assert.ok(trigger);
  const keys = [];
  const tokens = [];
  const channels = [];
  await real.runDemoReplies(trigger, {
    conversation,
    target: secondTarget,
    store: { async set(key) { keys.push(key); return 'OK'; } },
    getToken: async (...args) => { tokens.push(args); return 'fake-token'; },
    call: async (_token, method, body) => {
      channels.push(body.channel);
      if (method === 'conversations.info') return { data: { channel: { id: body.channel, is_private: false, is_archived: false } } };
      return { data: { channel: body.channel, ts: `${channels.length}.000`, message: { thread_ts: body.thread_ts } } };
    },
    wait: async () => {},
  });
  assert.deepEqual(tokens, [[second.connector, { subject: { type: 'app' }, installationId: second.teamId }]]);
  assert.ok(channels.every((channel) => channel === second.channel));
  assert.ok(keys.every((key) => key === `dreamforce:demo-trigger:${second.teamId}:${second.channel}:${trigger.ts}`));
});
