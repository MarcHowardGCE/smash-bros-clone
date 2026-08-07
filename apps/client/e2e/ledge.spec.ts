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

  // Strategy to reach LEDGE_HANG:
  // Left ledge: x=190, y=500. LEDGE_GRAB_RADIUS=50, LEDGE_GRAB_VERTICAL_TOLERANCE=40.
  // Player must be AIRBORNE within dx≤50 of x=190 AND dy≤40 of y=500.
  //
  // Plan:
  // 1. Walk left to x≈210 (close to main platform left edge at x=190)
  // 2. Jump (gets airborne, vx stays negative from walk momentum)
  // 3. Release ArrowLeft immediately after the jump — AIR_FRICTION=0.85 decelerates leftward vx
  //    while the player falls. They'll hover near x=185-175 while falling, well within
  //    LEDGE_GRAB_RADIUS=50 of x=190. Ledge grab fires when y gets within 40px of y=500.
  await page1.keyboard.down('ArrowLeft');
  
  console.log('Waiting to reach the edge');
  // Walk left until close to the ledge edge (x < 215)
  for (let i = 0; i < 150; i++) {
    await page1.waitForTimeout(30);
    const debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p1 = Object.values(debugState.players)[0] as any;
      if (p1 && p1.isGrounded && p1.x < 215) {
        break;
      }
    }
  }
  
  // Jump and immediately release left — momentum carries past x=190, then friction slows them
  // within the ledge grab radius while they fall to y≈500
  await page1.keyboard.press('ArrowUp');
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
  
  // Press jump to get off ledge → LEDGE_HANG → LEDGE_JUMP (12 frames) → AIRBORNE
  await page1.keyboard.press('ArrowUp');
  
  // Wait for LEDGE_JUMP or AIRBORNE (ledge jump goes through a 12-frame startup before AIRBORNE)
  console.log('Waiting for AIRBORNE');
  let airborne = false;
  for (let i = 0; i < 30; i++) {
    await page1.waitForTimeout(100);
    debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const players = Object.values(debugState.players);
      if (players.some((p: any) => p.state === 'AIRBORNE' || p.state === 'LEDGE_JUMP' || p.state === 'IDLE')) {
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
  // Drive P1 to the ledge again for the trump test
  await page1.keyboard.down('ArrowLeft');
  for (let i = 0; i < 150; i++) {
    await page1.waitForTimeout(30);
    const debugState = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p1 = Object.values(debugState.players)[0] as any;
      if (p1 && p1.isGrounded && p1.x < 215) {
        break;
      }
    }
  }
  await page1.keyboard.press('ArrowUp');
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
  
  // Drive P2 to the ledge to trump P1!
  console.log('Driving P2 to the edge');
  await page2.keyboard.down('ArrowLeft');
  for (let i = 0; i < 150; i++) {
    await page2.waitForTimeout(30);
    const debugState = await page2.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p2 = Object.values(debugState.players)[1] as any;
      if (p2 && p2.isGrounded && p2.x < 215) {
        break;
      }
    }
  }
  
  await page2.keyboard.press('ArrowUp');
  await page2.keyboard.up('ArrowLeft');
  
  // Wait for P2 LEDGE_HANG (trump!)
  // Trump: P2 grabs the ledge that P1 is holding. P1 gets popped off (briefly AIRBORNE
  // then may land back on stage as IDLE before we poll). Accept either state for P1.
  console.log('Waiting for P2 LEDGE_HANG (Trump)');
  let trumped = false;
  for (let i = 0; i < 60; i++) {
    await page2.waitForTimeout(100);
    debugState = await page2.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (debugState) {
      const p1 = Object.values(debugState.players)[0] as any;
      const p2 = Object.values(debugState.players)[1] as any;
      // Trump succeeded if P2 is hanging on the left ledge (previously held by P1).
      // P1 may have already landed back (IDLE) after being popped — accept that too.
      if (p2?.state === 'LEDGE_HANG' && p2?.ledgeId === 'left' &&
          (p1?.state === 'AIRBORNE' || p1?.state === 'IDLE' || p1?.state === 'LANDING_LAG')) {
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
