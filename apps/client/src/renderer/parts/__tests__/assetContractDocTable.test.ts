import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  FIGHTER_VISUAL_CONTRACTS,
  type FighterPartFilename,
  type FighterPartVisualContract,
} from '../assetContract.js';

type PartKey = keyof (typeof FIGHTER_VISUAL_CONTRACTS)['all-rounder']['parts'];

type DocTableRow = {
  readonly part: PartKey;
  readonly filename: FighterPartFilename;
  readonly rawCanvasPx: readonly [number, number];
  readonly logicalCanvas: readonly [number, number];
  readonly jointPx: readonly [number, number];
  readonly anchor: readonly [number, number];
  readonly referenceBoundsLogical: readonly [number, number, number, number];
};

const EXPECTED_PART_ORDER: readonly PartKey[] = ['HEAD', 'BODY', 'ARM_L', 'ARM_R', 'LEG_L', 'LEG_R'];

function parseIntPair(input: string): readonly [number, number] {
  const match = input.trim().match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
  if (!match) {
    throw new Error(`invalid pair format: ${input}`);
  }
  return [Number(match[1]), Number(match[2])] as const;
}

function parseCommaPair(input: string): readonly [number, number] {
  const items = input.split(',').map((item) => item.trim());
  if (items.length !== 2) {
    throw new Error(`invalid comma pair: ${input}`);
  }
  return [Number(items[0]), Number(items[1])] as const;
}

function parseCommaQuad(input: string): readonly [number, number, number, number] {
  const items = input.split(',').map((item) => item.trim());
  if (items.length !== 4) {
    throw new Error(`invalid comma quad: ${input}`);
  }
  return [Number(items[0]), Number(items[1]), Number(items[2]), Number(items[3])] as const;
}

function parseDocTableRows(markdown: string): readonly DocTableRow[] {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    line.trim() === '| part | filename | rawCanvasPx | logicalCanvas | jointPx | anchor | referenceBoundsLogical |',
  );

  if (headerIndex === -1) {
    throw new Error('table header not found in REPLACING-FIGHTER-ART.md');
  }

  const rows: DocTableRow[] = [];
  for (let i = headerIndex + 2; i < lines.length; i += 1) {
    const line = lines[i]?.trim() ?? '';
    if (!line.startsWith('|')) {
      break;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length !== 7) {
      throw new Error(`unexpected table cell count ${cells.length} for line: ${line}`);
    }

    const [partRaw, filenameRaw, rawCanvasRaw, logicalCanvasRaw, jointRaw, anchorRaw, boundsRaw] =
      cells as [string, string, string, string, string, string, string];
    const part = partRaw as PartKey;

    rows.push({
      part,
      filename: filenameRaw as FighterPartFilename,
      rawCanvasPx: parseIntPair(rawCanvasRaw),
      logicalCanvas: parseIntPair(logicalCanvasRaw),
      jointPx: parseCommaPair(jointRaw),
      anchor: parseCommaPair(anchorRaw),
      referenceBoundsLogical: parseCommaQuad(boundsRaw),
    });
  }

  return rows;
}

function asTuplePair(width: number, height: number): readonly [number, number] {
  return [width, height] as const;
}

function contractToExpectedRow(part: PartKey, entry: FighterPartVisualContract): DocTableRow {
  return {
    part,
    filename: entry.filename,
    rawCanvasPx: asTuplePair(entry.rawCanvasPx.width, entry.rawCanvasPx.height),
    logicalCanvas: asTuplePair(entry.logicalCanvas.width, entry.logicalCanvas.height),
    jointPx: asTuplePair(entry.jointPx.x, entry.jointPx.y),
    anchor: asTuplePair(entry.anchor.x, entry.anchor.y),
    referenceBoundsLogical: [
      entry.referenceBoundsLogical.x,
      entry.referenceBoundsLogical.y,
      entry.referenceBoundsLogical.width,
      entry.referenceBoundsLogical.height,
    ] as const,
  };
}

describe('REPLACING-FIGHTER-ART contract table', () => {
  it('stays numerically identical to assetContract.ts', async () => {
    const testDir = path.dirname(fileURLToPath(import.meta.url));
    const docPath = path.resolve(testDir, '..', '..', '..', '..', '..', '..', 'docs', 'assets', 'REPLACING-FIGHTER-ART.md');
    const markdown = await fs.readFile(docPath, 'utf8');
    const rows = parseDocTableRows(markdown);

    expect(rows).toHaveLength(EXPECTED_PART_ORDER.length);
    expect(rows.map((row) => row.part)).toEqual(EXPECTED_PART_ORDER);

    const contractParts = FIGHTER_VISUAL_CONTRACTS['all-rounder'].parts;
    const expectedRows = EXPECTED_PART_ORDER.map((part) => contractToExpectedRow(part, contractParts[part]));

    expect(rows).toEqual(expectedRows);
  });
});
