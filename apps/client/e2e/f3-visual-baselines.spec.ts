import { expect, test } from '@playwright/test';
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
const ACTUAL_ROOT = path.join(EVIDENCE_ROOT, 'actual');
const DIFF_ROOT = path.join(EVIDENCE_ROOT, 'diff');
const REPORT_PATH = path.join(EVIDENCE_ROOT, 'report.md');

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

const ensureDirs = async (): Promise<void> => {
  await fs.mkdir(BASELINE_ROOT, { recursive: true });
  await fs.mkdir(ACTUAL_ROOT, { recursive: true });
  await fs.mkdir(DIFF_ROOT, { recursive: true });
};

const readPng = async (pngPath: string): Promise<PNG> => {
  const data = await fs.readFile(pngPath);
  return PNG.sync.read(data);
};

const appendReport = async (line: string): Promise<void> => {
  await fs.appendFile(REPORT_PATH, `${line}\n`, 'utf8');
};

const compareWithBaseline = async (
  fixture: FixtureName,
  dprTag: string,
  actualPath: string,
): Promise<void> => {
  const baselinePath = path.join(BASELINE_ROOT, dprTag, `${fixture}.png`);
  const diffPath = path.join(DIFF_ROOT, dprTag, `${fixture}.png`);

  const actualImage = await readPng(actualPath);

  if (UPDATE_BASELINES) {
    await fs.mkdir(path.dirname(baselinePath), { recursive: true });
    await fs.copyFile(actualPath, baselinePath);
    await appendReport(`- baseline updated: ${dprTag}/${fixture}.png`);
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

  await appendReport(`- ${dprTag}/${fixture}: mismatch=${mismatchPixels}/${totalPixels} (${(ratio * 100).toFixed(4)}%)`);
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

test.beforeAll(async ({}, testInfo) => {
  await ensureDirs();
  const shouldWriteHeader = testInfo.project.name.includes('dpr-1');
  if (!shouldWriteHeader) {
    return;
  }

  if (UPDATE_BASELINES) {
    await fs.writeFile(
      REPORT_PATH,
      '# F3 visual QA report\n\n- mode: baseline-generation (UPDATE_BASELINES=1)\n- hook: query-gated fixture harness at /?e2e-fixture=1 (plus e2e-force-webgl=1 for draw-call measurement), exposed via window.__smashE2E\n',
      'utf8',
    );
    return;
  }

  await fs.writeFile(
    REPORT_PATH,
    '# F3 visual QA report\n\n- mode: baseline-compare\n- hook: query-gated fixture harness at /?e2e-fixture=1 (plus e2e-force-webgl=1 for draw-call measurement), exposed via window.__smashE2E\n- pixelmatch threshold: 0.1\n- max differing pixels: 0.5%\n',
    'utf8',
  );
});

test('captures fixture matrix and compares against committed baselines', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const dprTag = getDprTag(testInfo.project.name);
  const actualDir = path.join(ACTUAL_ROOT, dprTag);
  await fs.mkdir(actualDir, { recursive: true });

  await navigateFixtureHarness(page);

  const mode = await page.evaluate(() => {
    const win = window as Window & { __smashE2E?: SmashE2EApi };
    return win.__smashE2E?.getRendererMode() ?? 'polygon';
  });
  expect(mode, `${dprTag} fixture harness must run in sprite mode`).toBe('sprite');
  await appendReport(`- ${dprTag}: renderer mode=${mode}`);

  for (const fixture of FIXTURES) {
    const actualPath = path.join(actualDir, `${fixture}.png`);

    await page.evaluate((name: FixtureName) => {
      const win = window as Window & { __smashE2E?: SmashE2EApi };
      win.__smashE2E?.renderFixture(name);
    }, fixture);

    await page.screenshot({ path: actualPath, scale: 'device' });
    await compareWithBaseline(fixture, dprTag, actualPath);
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
    `- draw-calls(neutral-idle): count=${drawCallResult.count}, wrapped=${drawCallResult.wrappedMethods.join(', ')}`,
  );
});

test('polygon fallback still renders when forced via query flag', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  if (!testInfo.project.name.includes('dpr-1')) {
    test.skip();
  }

  const dprTag = getDprTag(testInfo.project.name);
  const polygonShot = path.join(EVIDENCE_ROOT, `polygon-fallback-${dprTag}.png`);
  await navigateFixtureHarness(page, 'renderer=polygon');

  const mode = await page.evaluate(() => {
    const win = window as Window & { __smashE2E?: SmashE2EApi };
    win.__smashE2E?.renderFixture('neutral-idle');
    return win.__smashE2E?.getRendererMode() ?? 'sprite';
  });

  expect(mode).toBe('polygon');
  await page.screenshot({ path: polygonShot, scale: 'device' });
  await appendReport(`- polygon fallback: mode=${mode}; screenshot=${path.relative(REPO_ROOT, polygonShot)}`);
});
