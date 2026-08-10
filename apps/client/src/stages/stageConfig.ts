/**
 * @fileoverview Stage configuration registry.
 *
 * Defines the {@link StageConfig} interface and the static {@link STAGES} array
 * of all six selectable stages. Helper functions {@link getRandomStage} and
 * {@link getStageById} are used by the stage-select UI and match initialization.
 */

/** Configuration for a single selectable stage. */
export interface StageConfig {
  id: string;
/** Display name shown in the stage-select UI. */
  displayName: string;
  /** Filename of the background image under `/public/backgrounds/`. */
  backgroundImage: string;
  /** Music track name without extension; played by {@link AudioManager}. */
  musicTrack: string;
}

export const STAGES: StageConfig[] = [
  {
    id: 'stage1',
    displayName: 'Stage 1',
    backgroundImage: 'stage1.png',
    musicTrack: 'stage1.mp3',
  },
  {
    id: 'stage2',
    displayName: 'Stage 2',
    backgroundImage: 'stage2.png',
    musicTrack: 'stage2.mp3',
  },
  {
    id: 'stage3',
    displayName: 'Stage 3',
    backgroundImage: 'stage3.png',
    musicTrack: 'stage3.mp3',
  },
  {
    id: 'stage4',
    displayName: 'Stage 4',
    backgroundImage: 'stage4.png',
    musicTrack: 'stage4.mp3',
  },
  {
    id: 'stage5',
    displayName: 'Stage 5',
    backgroundImage: 'stage5.png',
    musicTrack: 'stage5.mp3',
  },
  {
    id: 'stage6',
    displayName: 'Stage 6',
    backgroundImage: 'stage6.png',
    musicTrack: 'stage6.mp3',
  },
];

/**
 * Pick a random stage from the registry with equal probability.
 *
 * @returns A randomly selected {@link StageConfig}
 */
export function getRandomStage(): StageConfig {
  const randomIndex = Math.floor(Math.random() * STAGES.length);
  return STAGES[randomIndex]!;
}

/**
 * Look up a stage by its unique ID.
 *
 * @param id - Stage ID (e.g. `'stage1'`)
 * @returns The matching {@link StageConfig}, or `undefined` if not found
 */
export function getStageById(id: string): StageConfig | undefined {
  return STAGES.find((stage) => stage.id === id);
}
