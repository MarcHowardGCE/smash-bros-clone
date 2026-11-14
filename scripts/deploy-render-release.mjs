import { setTimeout as sleep } from 'node:timers/promises';

const { GITHUB_SHA: commit, RENDER_DEPLOY_HOOK_URL: hook } = process.env;
if (!/^[a-f\d]{40}$/.test(commit ?? '') || !hook) {
  throw new Error('A full commit SHA and the Render deploy hook secret are required.');
}
const url = new URL(hook);
if (url.origin !== 'https://api.render.com' || !url.pathname.startsWith('/deploy/')) {
  throw new Error('Use the service deploy hook from Render.');
}

const health = 'https://everybody-throws-hands.onrender.com/healthz';
async function isLive() {
  try {
    const response = await fetch(health, { signal: AbortSignal.timeout(10000) });
    return response.ok && (await response.json()).commit === commit;
  } catch {
    return false;
  }
}

if (!(await isLive())) {
  url.searchParams.set('ref', commit);
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  }).catch(() => { throw new Error('Unable to reach the Render deploy hook.'); });
  if (!response.ok) throw new Error(`Render deploy hook returned HTTP ${response.status}.`);

  const deadline = Date.now() + 20 * 60 * 1000;
  while (!(await isLive())) {
    if (Date.now() >= deadline) throw new Error(`Render did not serve commit ${commit} before the deadline.`);
    await sleep(5000);
  }
}
console.log(`Render is serving commit ${commit}.`);
