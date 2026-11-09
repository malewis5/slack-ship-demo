import demoConfig from "../demo.config.json" with { type: "json" };

// One deployment can serve several Slack apps (one Vercel Connect connector
// each). The primary target keeps the original single-app variables, so
// existing deployments behave exactly as before. Additional apps are listed in
// SLACK_EXTRA_TARGETS as a JSON array:
//   [{"connector":"slack/other","appId":"A…","teamId":"T…","channel":"C…"}]

const patterns = {
  connector: /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
  appId: /^A[A-Z0-9]+$/,
  team: /^T[A-Z0-9]+$/,
  channel: /^C[A-Z0-9]+$/,
};

function valid(target) {
  return Object.entries(patterns).every(
    ([key, pattern]) => typeof target[key] === "string" && pattern.test(target[key]),
  );
}

export function loadSlackTargets(env = process.env) {
  const primary = {
    connector: env.SLACK_CONNECTOR_ID || "slack/demo-agent",
    appId: env.SLACK_APP_ID || demoConfig.slackAppId,
    team: env.SLACK_TEAM_ID || demoConfig.slackTeamId,
    channel: env.SLACK_CHANNEL_ID || demoConfig.slackChannel,
  };
  const targets = [primary];
  const raw = env.SLACK_EXTRA_TARGETS?.trim();
  if (!raw) return targets;

  let extras;
  try {
    extras = JSON.parse(raw);
  } catch {
    extras = null;
  }
  if (!Array.isArray(extras)) {
    // Fail closed for the extras only; the primary app keeps working.
    console.error("SLACK_EXTRA_TARGETS must be a JSON array; extra Slack targets ignored.");
    return targets;
  }
  for (const [index, item] of extras.entries()) {
    const target = item && typeof item === "object" ? {
      connector: item.connector,
      appId: item.appId,
      team: item.teamId,
      channel: item.channel,
    } : {};
    if (!valid(target)) {
      console.error(`SLACK_EXTRA_TARGETS[${index}] is invalid; entry ignored.`);
      continue;
    }
    if (targets.some((existing) => existing.appId === target.appId && existing.team === target.team)) {
      console.error(`SLACK_EXTRA_TARGETS[${index}] duplicates an existing app and workspace; entry ignored.`);
      continue;
    }
    targets.push(target);
  }
  return targets;
}

export const slackTargets = loadSlackTargets();
export const primaryTarget = slackTargets[0];

export function findSlackTarget(appId, teamId, targets = slackTargets) {
  return targets.find((target) => target.appId === appId && target.team === teamId) ?? null;
}
