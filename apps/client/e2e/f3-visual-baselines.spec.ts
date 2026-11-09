import { expect, test, type TestInfo } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);
const REPO_ROOT = path.resolve(CURRENT_DIR, '..', '..', '..');
const EVIDENCE_ROOT = path.join(REPO_ROOT, 'docs', 'assets', 'evidence', 'f3-visual');
const BASELINE_ROOT = path.join(EVIDENCE_ROOT, 'baselines');
const UPDATE_BASELINES = process.env.UPDATE_BASELINES === '1';
const PIXELMATCH_THRESHOLD = 0.1;
const MAX_DIFF_RATIO = 0.005;

const FIXTURES = [
  'neutral-idle',
  'hit-flash-slot-0',
  'hit-flash-slot-1',
  'hit-flash-slot-2',
  'hit-flash-slot-3',
  'lincoln-idle',
  'facing-flipped',
  'squash-stretch',
  'invincibility-alpha-0.4',
  'camera-scale-0.4',
] as const;

type FixtureName = (typeof FIXTURES)[number];

type DrawCallResult = {
  readonly count: number;
  readonly wrappedMethods: readonly string[];
  readonly hasContext: boolean;
};

type SmashE2EApi = {
  readonly ready: boolean;
  renderFixture: (name: FixtureName) => void;
  measureDrawCalls: (name: FixtureName) => DrawCallResult;
  getRendererMode: () => 'sprite' | 'polygon';
  getGameScale: () => { readonly x: number; readonly y: number };
};

const getDprTag = (projectName: string): string => {
  if (projectName.includes('dpr-1')) return 'dpr-1';
  if (projectName.includes('dpr-2')) return 'dpr-2';
  if (projectName.includes('dpr-3')) return 'dpr-3';
  throw new Error(`Unknown project for DPR extraction: ${projectName}`);
};

const readPng = async (pngPath: string): Promise<PNG> => {
  const data = await fs.readFile(pngPath);
  return PNG.sync.read(data);
};

const appendReport = async (testInfo: TestInfo, line: string): Promise<void> => {
  await fs.appendFile(testInfo.outputPath("visual-report.md"), `${line}\n`, 'utf8');
};

const compareWithBaseline = async (
  testInfo: TestInfo,
  fixture: FixtureName,
  dprTag: string,
  actualPath: string,
): Promise<void> => {
  const baselinePath = path.join(BASELINE_ROOT, dprTag, `${fixture}.png`);
  const diffPath = testInfo.outputPath("diff", `${fixture}.png`);

  const actualImage = await readPng(actualPath);

  if (UPDATE_BASELINES) {
    await fs.mkdir(path.dirname(baselinePath), { recursive: true });
    await fs.copyFile(actualPath, baselinePath);
    await appendReport(testInfo, `- baseline updated: ${dprTag}/${fixture}.png`);
    return;
  }

  let baselineImage: PNG;
  try {
    baselineImage = await readPng(baselinePath);
  } catch {
    throw new Error(`Missing baseline: ${baselinePath}. Re-run with UPDATE_BASELINES=1 once.`);
  }

  expect(actualImage.width, `${fixture} width`).toBe(baselineImage.width);
  expect(actualImage.height, `${fixture} height`).toBe(baselineImage.height);

  const diffImage = new PNG({ width: actualImage.width, height: actualImage.height });
  const mismatchPixels = pixelmatch(
    baselineImage.data,
    actualImage.data,
    diffImage.data,
    actualImage.width,
    actualImage.height,
    { threshold: PIXELMATCH_THRESHOLD },
  );

  const totalPixels = actualImage.width * actualImage.height;
  const ratio = mismatchPixels / totalPixels;

  await fs.mkdir(path.dirname(diffPath), { recursive: true });
  await fs.writeFile(diffPath, PNG.sync.write(diffImage));

  await appendReport(testInfo, `- ${dprTag}/${fixture}: mismatch=${mismatchPixels}/${totalPixels} (${(ratio * 100).toFixed(4)}%)`);
  expect(ratio, `${dprTag}/${fixture} mismatch ratio`).toBeLessThanOrEqual(MAX_DIFF_RATIO);
};

const navigateFixtureHarness = async (page: import('@playwright/test').Page, extraQuery = ''): Promise<void> => {
  const query = extraQuery.length > 0 ? `&${extraQuery}` : '';
  await page.goto(`/?e2e-fixture=1&e2e-force-webgl=1${query}`);
  await page.waitForFunction(() => {
    const win = window as Window & { __smashE2E?: SmashE2EApi };
    return win.__smashE2E?.ready === true;
  }, { timeout: 20_000 });
};

test('captures fixture matrix and compares against committed baselines', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const dprTag = getDprTag(testInfo.project.name);
  const actualDir = testInfo.outputPath("actual");
  await fs.mkdir(actualDir, { recursive: true });

  await navigateFixtureHarness(page);

  const mode = await page.evaluate(() => {
    const win = window as Window & { __smashE2E?: SmashE2EApi };
    return win.__smashE2E?.getRendererMode() ?? 'polygon';
  });
  expect(mode, `${dprTag} fixture harness must run in sprite mode`).toBe('sprite');
  await appendReport(testInfo, `- ${dprTag}: renderer mode=${mode}; mode=${UPDATE_BASELINES ? "update" : "compare"}`);
  await expect(page.locator("#background-layer .scene-art")).toHaveCSS("background-image", /stage1\.webp/);
  await page.screenshot({ path: testInfo.outputPath("neutral-idle-in-arena.png"), scale: "device" });

  for (const fixture of FIXTURES) {
    const actualPath = path.join(actualDir, `${fixture}.png`);

    await page.evaluate((name: FixtureName) => {
      const win = window as Window & { __smashE2E?: SmashE2EApi };
      win.__smashE2E?.renderFixture(name);
    }, fixture);

    // Compare the combat layer without duplicating the decorative scene in every baseline.
    await page.screenshot({ path: actualPath, scale: 'device', style: '#background-layer { visibility: hidden }' });
    await compareWithBaseline(testInfo, fixture, dprTag, actualPath);
  }
});

test('reports draw call measurement from wrapped gl draw* methods', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  if (!testInfo.project.name.includes('dpr-1')) {
    test.skip();
  }

  await navigateFixtureHarness(page);
  const drawCallResult = await page.evaluate(() => {
    const win = window as Window & { __smashE2E?: SmashE2EApi };
    if (!win.__smashE2E) {
      return null;
    }
    return win.__smashE2E.measureDrawCalls('neutral-idle');
  });

  expect(drawCallResult).not.toBeNull();
  if (drawCallResult === null) {
    return;
  }

  expect(drawCallResult.hasContext).toBe(true);
  expect(drawCallResult.wrappedMethods.length).toBeGreaterThan(0);
  await appendReport(
    testInfo,
    `- draw-calls(neutral-idle): count=${drawCallResult.count}, wrapped=${drawCallResult.wrappedMethods.join(', ')}`,
  );
});

test('polygon fallback still renders when forced via query flag', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  if (!testInfo.project.name.includes('dpr-1')) {
    test.skip();
  }

  const dprTag = getDprTag(testInfo.project.name);
  const polygonShot = testInfo.outputPath(`polygon-fallback-${dprTag}.png`);
  await navigateFixtureHarness(page, 'renderer=polygon');

  const mode = await page.evaluate(() => {
    const win = window as Window & { __smashE2E?: SmashE2EApi };
    win.__smashE2E?.renderFixture('neutral-idle');
    return win.__smashE2E?.getRendererMode() ?? 'sprite';
  });

  expect(mode).toBe('polygon');
  await page.screenshot({ path: polygonShot, scale: 'device' });
  await appendReport(testInfo, `- polygon fallback: mode=${mode}; screenshot=${path.basename(polygonShot)}`);
});
