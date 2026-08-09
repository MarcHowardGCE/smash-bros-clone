import { Buffer } from 'node:buffer';
import { describe, expect, it, vi } from 'vitest';
import { MatchSession } from './MatchSession.js';

/**
 * MatchSession pause/resume integration tests
 *
 * Key invariants:
 * 1. pause() sets internal flag, broadcast count freezes, setImmediate loop stays alive
 * 2. Inputs received while paused are dropped (not queued)
 * 3. resume() clears flag, ticking resumes without accumulator spike
 */

describe('MatchSession pause/resume', () => {
	it('pause freezes tick count, resume restarts ticking', async () => {
		const broadcasts: Uint8Array[] = [];
		const session = new MatchSession({
			playerIds: ['p1', 'p2'],
			characterIds: { 'p1': 'all-rounder', 'p2': 'all-rounder' },
			onBroadcast: (data) => {
				const bytes = data instanceof Buffer ? new Uint8Array(data) : data;
				broadcasts.push(bytes);
			},
			onMatchOver: () => {},
		});

		session.start();

		// Wait for ~4 broadcast cycles (60ms at 20Hz = 3 broadcasts)
		await new Promise((resolve) => setTimeout(resolve, 100));
		const tickCountBeforePause = (session as unknown as { tickCount: number }).tickCount;
		expect(tickCountBeforePause).toBeGreaterThan(0);

		session.pause();

		// Wait another 50ms — tick count should NOT advance
		await new Promise((resolve) => setTimeout(resolve, 50));
		const tickCountDuringPause = (session as unknown as { tickCount: number }).tickCount;
		expect(tickCountDuringPause).toBe(tickCountBeforePause);

		session.resume();

		// Wait 50ms — ticking should resume
		await new Promise((resolve) => setTimeout(resolve, 50));
		const tickCountAfterResume = (session as unknown as { tickCount: number }).tickCount;
		expect(tickCountAfterResume).toBeGreaterThan(tickCountDuringPause);

		session.stop();
	});

	it('pause broadcasts game:paused event, resume broadcasts game:resumed', async () => {
		const broadcasts: Uint8Array[] = [];
		const session = new MatchSession({
			playerIds: ['p1', 'p2'],
			characterIds: { 'p1': 'all-rounder', 'p2': 'all-rounder' },
			onBroadcast: (data) => {
				const bytes = data instanceof Buffer ? new Uint8Array(data) : data;
				broadcasts.push(bytes);
			},
			onMatchOver: () => {},
		});

		session.start();
		await new Promise((resolve) => setTimeout(resolve, 50));

		const beforePauseBroadcastCount = broadcasts.length;
		session.pause();

		// pause() should have broadcast one event
		expect(broadcasts.length).toBe(beforePauseBroadcastCount + 1);

		const beforeResumeBroadcastCount = broadcasts.length;
		session.resume();

		// resume() should have broadcast one event
		expect(broadcasts.length).toBe(beforeResumeBroadcastCount + 1);

		session.stop();
	});

	it('queueInput drops inputs when paused', async () => {
		const session = new MatchSession({
			playerIds: ['p1', 'p2'],
			characterIds: { 'p1': 'all-rounder', 'p2': 'all-rounder' },
			onBroadcast: () => {},
			onMatchOver: () => {},
		});

		session.start();
		await new Promise((resolve) => setTimeout(resolve, 30));

		session.pause();

		// Attempt to queue an input while paused
		const input = {
			seq: 1,
			tick: 10,
			held: 0,
			pressed: 1,
			released: 0,
			playerId: 'p1',
		};
		session.queueInput('p1', input);

		// Access internal inputQueue to verify it's empty
		const inputQueue = (session as unknown as { inputQueue: Map<string, unknown[]> }).inputQueue;
		const p1Queue = inputQueue.get('p1');
		expect(p1Queue).toBeDefined();
		expect(p1Queue).toHaveLength(0); // Input was dropped

		session.stop();
	});

	it('pause when not running is a no-op', () => {
		const session = new MatchSession({
			playerIds: ['p1', 'p2'],
			characterIds: { 'p1': 'all-rounder', 'p2': 'all-rounder' },
			onBroadcast: () => {},
			onMatchOver: () => {},
		});

		// Don't call start()
		session.pause(); // Should not crash

		const paused = (session as unknown as { paused: boolean }).paused;
		expect(paused).toBe(false); // pause() returns early when !isRunning
	});

	it('resume when not paused is a no-op', async () => {
		const session = new MatchSession({
			playerIds: ['p1', 'p2'],
			characterIds: { 'p1': 'all-rounder', 'p2': 'all-rounder' },
			onBroadcast: () => {},
			onMatchOver: () => {},
		});

		session.start();
		await new Promise((resolve) => setTimeout(resolve, 30));

		// Call resume without pause
		session.resume(); // Should not crash

		const paused = (session as unknown as { paused: boolean }).paused;
		expect(paused).toBe(false);

		session.stop();
	});

	it('double pause is idempotent', async () => {
		const broadcasts: Uint8Array[] = [];
		const session = new MatchSession({
			playerIds: ['p1', 'p2'],
			characterIds: { 'p1': 'all-rounder', 'p2': 'all-rounder' },
			onBroadcast: (data) => {
				const bytes = data instanceof Buffer ? new Uint8Array(data) : data;
				broadcasts.push(bytes);
			},
			onMatchOver: () => {},
		});

		session.start();
		await new Promise((resolve) => setTimeout(resolve, 30));

		const beforePause = broadcasts.length;
		session.pause();
		expect(broadcasts.length).toBe(beforePause + 1);

		session.pause(); // Second pause
		expect(broadcasts.length).toBe(beforePause + 1); // No additional broadcast

		session.stop();
	});
});
