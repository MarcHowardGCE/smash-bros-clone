import { test, expect } from '@playwright/test';

test('ledge grab, jump getup, and trump lifecycle', async ({ browser }) => {
  test.setTimeout(120000);
  // Create 2 browser contexts (2 players)
  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  await page1.goto('http://localhost:5173');
  
  // Create room on page1
  await page1.click('#create-btn');
  // Wait for the URL to update with ?room=...
  await page1.waitForURL(/room=/);
  const roomUrl = page1.url();
  
  // Join on page2
  await page2.goto(roomUrl);
  
  // Both ready up
  await page1.click('#ready-btn');
  await page2.click('#ready-btn');
  
  // Wait for match to start
  console.log('Waiting for match to start');
  try {
    await page1.waitForFunction(() => {
      const state = (window as any).__DEBUG_GAME_STATE__?.();
      return state?.matchPhase === 'match';
    }, { timeout: 10000, polling: 100 });
  } catch (e) {
    console.log('Timeout waiting for match phase');
    throw e;
  }
  
  console.log('Match started');
  
  // Wait until they have landed from spawn
  console.log('Waiting for spawn landing');
  for (let i = 0; i < 30; i++) {
    await page1.waitForTimeout(50);
    const debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p1 = Object.values(debugState.players)[0] as any;
      if (p1 && p1.state === 'IDLE') {
        break;
      }
    }
  }

  // Drive player 1 to the edge
  await page1.keyboard.down('ArrowLeft');
  
  // Wait until they are near the edge
  console.log('Waiting to reach the edge');
  for (let i = 0; i < 50; i++) {
    await page1.waitForTimeout(50);
    const debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p1 = Object.values(debugState.players)[0] as any;
      if (p1 && p1.x < 290) {
        break;
      }
    }
  }
  
  // Jump!
  await page1.keyboard.press('ArrowUp');
  await page1.waitForTimeout(200); // hold left a bit longer while in air
  
  // IMMEDIATELY release ArrowLeft so we don't trigger LEDGE_CLIMB automatically
  await page1.keyboard.up('ArrowLeft');
  
  // Now wait for LEDGE_HANG
  console.log('Waiting for LEDGE_HANG');
  let ledgeHang = false;
  let debugState: any = null;
  for (let i = 0; i < 60; i++) {
    await page1.waitForTimeout(100);
    debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const players = Object.values(debugState.players);
      if (players.some((p: any) => p.state === 'LEDGE_HANG')) {
        ledgeHang = true;
        break;
      }
    }
  }
  if (!ledgeHang) {
    console.log('Timeout waiting for LEDGE_HANG. State:', JSON.stringify(debugState));
    await page1.screenshot({ path: '.sisyphus/evidence/timeout-ledge-hang.png' });
    throw new Error('Timeout waiting for LEDGE_HANG');
  }
  console.log('Got LEDGE_HANG');
  await page1.screenshot({ path: '.sisyphus/evidence/task-20-ledge-hang.png' });
  
  // Press jump to get off ledge
  await page1.keyboard.press('ArrowUp');
  
  // Wait for AIRBORNE (jump from ledge)
  console.log('Waiting for AIRBORNE');
  let airborne = false;
  for (let i = 0; i < 30; i++) {
    await page1.waitForTimeout(200);
    debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const players = Object.values(debugState.players);
      if (players.some((p: any) => p.state === 'AIRBORNE')) {
        airborne = true;
        break;
      }
    }
  }
  if (!airborne) {
    throw new Error('Timeout waiting for AIRBORNE');
  }
  
  await page1.screenshot({ path: '.sisyphus/evidence/task-20-ledge-jump.png' });
  
  // Press jump to get off ledge
  // Wait! The task says "trump lifecycle" as well. Let's not jump getup player 1 yet!
  // Instead, let player 1 hang, and drive player 2 off the edge to trump them.
  // Wait, I already did "Press jump to get off ledge". Let me test Jump Getup, THEN test trump.
  // The test already verified ledge jump. Now let's have player 2 do a trump!
  
  // Wait, Player 1 is now AIRBORNE. They will land on the stage.
  // Let's drive player 1 off the edge AGAIN to hang on the ledge.
  await page1.keyboard.down('ArrowLeft');
  for (let i = 0; i < 50; i++) {
    await page1.waitForTimeout(50);
    const debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p1 = Object.values(debugState.players)[0] as any;
      if (p1 && p1.x < 220) {
        break;
      }
    }
  }
  await page1.keyboard.press('ArrowUp');
  await page1.waitForTimeout(50);
  await page1.keyboard.up('ArrowLeft');
  
  // Wait for P1 LEDGE_HANG again
  console.log('Waiting for P1 LEDGE_HANG 2');
  ledgeHang = false;
  for (let i = 0; i < 60; i++) {
    await page1.waitForTimeout(100);
    debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const players = Object.values(debugState.players);
      if (players[0]?.state === 'LEDGE_HANG') {
        ledgeHang = true;
        break;
      }
    }
  }
  
  // Now drive P2 to the edge to trump P1!
  console.log('Driving P2 to the edge');
  await page2.keyboard.down('ArrowLeft');
  for (let i = 0; i < 50; i++) {
    await page2.waitForTimeout(50);
    const debugState = await page2.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p2 = Object.values(debugState.players)[1] as any;
      if (p2 && p2.x < 290) {
        break;
      }
    }
  }
  
  await page2.keyboard.press('ArrowUp');
  await page2.waitForTimeout(200);
  await page2.keyboard.up('ArrowLeft');
  
  // Wait for P2 LEDGE_HANG (trump!)
  console.log('Waiting for P2 LEDGE_HANG (Trump)');
  let trumped = false;
  for (let i = 0; i < 60; i++) {
    await page2.waitForTimeout(100);
    debugState = await page2.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p1 = Object.values(debugState.players)[0] as any;
      const p2 = Object.values(debugState.players)[1] as any;
      // If P2 hangs, and P1 is airborne (popped off)
      if (p2?.state === 'LEDGE_HANG' && p1?.state === 'AIRBORNE') {
        trumped = true;
        break;
      }
    }
  }
  
  if (!trumped) {
    console.log('Timeout waiting for TRUMP. State:', JSON.stringify(debugState));
    throw new Error('Timeout waiting for TRUMP');
  }
  console.log('Got TRUMP');
  await page2.screenshot({ path: '.sisyphus/evidence/task-20-ledge-trump.png' });
  
  await ctx1.close();
  await ctx2.close();
});
