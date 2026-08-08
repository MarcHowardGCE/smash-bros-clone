import { expect, test } from '@playwright/test';

test('favicon loads without 404', async ({ page }) => {
	const faviconErrors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() !== 'error') {
			return;
		}

		const text = msg.text().toLowerCase();
		if (text.includes('favicon') && text.includes('404')) {
			faviconErrors.push(msg.text());
		}
	});

	await page.goto('http://localhost:5173');
	await page.waitForTimeout(2000);

	expect(faviconErrors).toHaveLength(0);
});
