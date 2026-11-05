import { test, expect, type Page } from "@playwright/test";
async function snapshot(page: Page) {
  return page.evaluate(() => (window as any).__smashDebug?.getSnapshot());
}
test("online pause, browser-refresh rejoin, resume and deliberate leave", async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(60_000);
  const contextOptions = { deviceScaleFactor: testInfo.project.use.deviceScaleFactor ?? 1, viewport: { width: 1280, height: 720 } };
  const a = await browser.newContext(contextOptions), b = await browser.newContext(contextOptions);
  const host = await a.newPage(), guest = await b.newPage();
  const errors: string[] = [];
  host.on("pageerror", error => errors.push(error.message));
  guest.on("pageerror", error => errors.push(error.message));
  try {
    await host.goto(baseURL!);
    await host.locator("#splash-screen").click();
    await host.locator("#create-btn").click();
    await expect(host).toHaveURL(/room=/);
    const roomUrl = host.url();
    await guest.goto(roomUrl);
    await guest.locator("#splash-screen").click();
    await Promise.all([host.locator("#ready-btn").click(), guest.locator("#ready-btn").click()]);
    await host.locator('.network-fighter-option[data-id="abe-lincoln"]').click();
    await guest.locator('.network-fighter-option[data-id="swift"]').click();
    await Promise.all([host.locator("#network-charselect-confirm-btn").click(), guest.locator("#network-charselect-confirm-btn").click()]);
    await host.locator('[data-stage-idx="0"]').click();
    await expect.poll(async () => (await snapshot(host))?.matchPhase).toBe("match");
    const before = await snapshot(guest);
    const guestId = Object.values(before.players).find((p: any) => p.characterId === "swift") as any;
    expect(guestId).toBeTruthy();
    await host.keyboard.press("Escape");
    await expect(host.locator("#resume-btn")).toBeVisible();
    await expect(guest.locator("#resume-btn")).toBeVisible();
    const pausedTick = (await snapshot(guest)).tick;
    await guest.reload();
    await expect(guest.locator("#resume-btn")).toBeVisible();
    await expect.poll(async () => (await snapshot(guest))?.tick ?? -1).toBeGreaterThanOrEqual(pausedTick);
    const recovered = await snapshot(guest);
    expect(recovered.players[guestId.id].characterId).toBe("swift");
    expect(recovered.tick).toBeGreaterThanOrEqual(pausedTick);
    expect(recovered.tick - pausedTick).toBeLessThan(3);
    await guest.waitForTimeout(150);
    expect((await snapshot(guest)).tick).toBe(recovered.tick);
    await guest.locator("#resume-btn").click();
    await expect(host.locator("#resume-btn")).toBeHidden();
    // Each client must receive its own resume acknowledgement before its next input.
    await expect(guest.locator("#resume-btn")).toBeHidden();
    await expect.poll(async () => (await snapshot(guest))?.tick).toBeGreaterThan(pausedTick);
    await guest.keyboard.press("Escape");
    await expect(guest.locator("#main-menu-btn")).toBeVisible();
    await guest.locator("#main-menu-btn").click();
    await expect(guest.locator("#create-btn")).toBeVisible();
    await expect(host.locator("#play-again-btn")).toBeVisible();
    expect(await guest.evaluate(() => sessionStorage.getItem("smash:rejoin"))).toBeNull();
    expect(errors).toEqual([]);
  } finally { await Promise.allSettled([a.close(), b.close()]); }
});
