import { test, expect } from "@playwright/test";
import { startLocalMatch, stageDuel } from "./helpers/flow";
test("F3: staged local movement, hit, pause, KO and result lifecycle", async ({ page }) => {
  test.setTimeout(45_000);
  await startLocalMatch(page);
  const state = () => page.evaluate(() => (window as any).__smashDebug.getSnapshot());
  const initial = await state();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(200);
  await page.keyboard.up("ArrowRight");
  expect((await state()).players["local-p1"].x).toBeGreaterThan(initial.players["local-p1"].x);
  // Positioning and victim stun are test setup; hits and KOs still use actual input/physics.
  await stageDuel(page);
  await page.keyboard.press("KeyZ", { delay: 100 });
  await expect.poll(async () => (await state()).players["local-p2"].percent).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#resume-btn")).toBeVisible();
  const paused = await state();
  await page.waitForTimeout(150);
  expect((await state()).tick).toBe(paused.tick);
  await page.locator("#resume-btn").click();
  await expect.poll(async () => (await state()).tick).toBeGreaterThan(paused.tick);
  for (let remaining=2;remaining>=0;remaining--) {
    await page.evaluate(() => (window as any).__smashDebug.forcePosition("local-p2", 640, 850));
    await expect.poll(async () => (await state()).players["local-p2"].stocks).toBe(remaining);
    if (remaining) {
      await expect.poll(async () => (await state()).players["local-p2"].respawnTimer, { timeout: 5000 }).toBe(0);
    }
  }
  await expect(page.locator("#local-play-again-btn")).toBeVisible();
  await page.locator("#main-menu-btn").click();
  await expect(page.locator("#create-btn")).toBeVisible();
});
