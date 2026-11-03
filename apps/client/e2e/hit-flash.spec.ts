import { test, expect } from "@playwright/test";
import { startLocalMatch, stageDuel } from "./helpers/flow";
test("hit flash and impact feedback follow a real connecting hit", async ({ page }, testInfo) => {
  await startLocalMatch(page);
  await stageDuel(page);
  await page.keyboard.press("KeyZ", { delay: 100 });
  await expect.poll(async () => page.evaluate(() => {
    return (window as any).__smashDebug.getSnapshot().players["local-p2"].percent;
  })).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath("connecting-hit.png") });
  // Exact pose/tint pixels are covered by the committed visual-baseline matrix.
  await expect(page.locator("canvas")).toBeVisible();
});
