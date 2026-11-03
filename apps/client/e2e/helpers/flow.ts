import { type Page } from "@playwright/test";
export async function dismissSplash(page: Page): Promise<void> {
  await page.locator("#splash-screen").click();
  await page.locator("#local-play-btn").waitFor();
}
export async function chooseFirstStage(page: Page): Promise<void> {
  await page.locator('[data-stage-idx="0"]').click();
}

export async function startLocalMatch(page: Page): Promise<void> {
  await page.goto("/");
  await dismissSplash(page);
  await page.locator("#local-play-btn").click();
  await page.locator("#lps-start-btn").click();
  await page.keyboard.press("Enter");
  await chooseFirstStage(page);
  await page.waitForFunction(() => (window as any).__smashDebug?.getSnapshot()?.matchPhase === "match");
}
export async function stageDuel(page: Page): Promise<void> {
  await page.evaluate(() => {
    const debug = (window as any).__smashDebug;
    debug.forcePosition("local-p1", 600, 472);
    debug.forcePosition("local-p2", 645, 472);
    const players = debug.getSnapshot().players;
    Object.assign(players["local-p1"], { state: "IDLE", isGrounded: true, facing: 1 });
    Object.assign(players["local-p2"], { state: "HITSTUN", isGrounded: true, hitstunFramesRemaining: 3600 });
  });
}
