import { expect, test } from '@playwright/test';

test('logo loads without 404 and renders at top of page', async ({ page }) => {
	const consoleErrors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() !== 'error') {
			return;
		}

		const text = msg.text().toLowerCase();
		if (text.includes('branding') || text.includes('404')) {
			consoleErrors.push(msg.text());
		}
	});

	await page.goto('http://localhost:5173');
	await page.waitForSelector('img[alt="Everybody Throws Hands"]', { timeout: 5000 });

	// Assert: no console errors mentioning branding or 404
	expect(consoleErrors).toHaveLength(0);

	// Assert: image is visible
	const logoImg = page.locator('img[alt="Everybody Throws Hands"]');
	expect(await logoImg.isVisible()).toBe(true);

	// Assert: image has non-zero rendered width
	const boundingBox = await logoImg.boundingBox();
	expect(boundingBox).not.toBeNull();
	expect(boundingBox!.width).toBeGreaterThan(0);

	// Assert: logo is positioned at top of page (not vertically centered)
	expect(boundingBox!.y).toBeLessThan(200); // Should be near top, not center

	// Take screenshot for evidence
	await page.screenshot({ path: '.omo/evidence/logo-lobby-screen.png' });
});
