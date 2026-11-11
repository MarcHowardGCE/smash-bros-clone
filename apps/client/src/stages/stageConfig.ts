import { STAGE_BACKGROUND_VARIANTS, isStageBackgroundVariant } from '@smash/shared';
import { WORLD_STORIES } from '../ui/selectionContent';
/**
 * @fileoverview Stage configuration registry.
 *
 * Defines the {@link StageConfig} interface and the static {@link STAGES} array
 * of all selectable stages. Helper functions {@link getRandomStage} and
 * {@link getStageById} are used by the stage-select UI and match initialization.
 */

/** Configuration for a single selectable stage. */
export interface StageConfig {
  id: string;
/** Display name shown in the stage-select UI. */
  displayName: string;
  /** Filename of the background image under `/public/backgrounds/`. */
  backgroundImage: string;
  /** Resolved once during menu selection; synchronized by the online room. */
  backgroundVariant?: number;
  menuImage?: string;
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
  { id: 'stage7', displayName: 'Stage 7', backgroundImage: 'stage08.webp', musicTrack: 'stage7.mp3' },
  { id: 'stage8', displayName: 'Stage 8', backgroundImage: 'stage09.webp', musicTrack: 'stage8.mp3' },
  { id: 'stage9', displayName: 'Stage 9', backgroundImage: 'stage07.webp', musicTrack: 'stage9.mp3' },
  { id: 'stage10', displayName: 'Zanda Infinity', backgroundImage: 'stage10-studio.webp', menuImage:'stage10-studio.webp', musicTrack: 'stage10.mp3' },
].map(stage => ({...stage, displayName: WORLD_STORIES[stage.id]?.name ?? stage.displayName}));

/**
 * Pick a random stage from the registry with equal probability.
 *
 * @returns A randomly selected {@link StageConfig}
 */
export function getRandomStage(): StageConfig {
  const randomIndex = Math.floor(Math.random() * STAGES.length);
  return chooseStageVisual(STAGES[randomIndex]!);
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

/** Resolve an authoritative cosmetic index without randomizing on render or reconnect. */
export function withStageVisual(stage:StageConfig, variant:number=0):StageConfig {
  const backgrounds=STAGE_BACKGROUND_VARIANTS[stage.id];
  if(!backgrounds)return stage;
  const index=isStageBackgroundVariant(stage.id,variant)?variant:0;
  const backgroundImage=backgrounds[index]!;
  return {...stage,backgroundVariant:index,backgroundImage,menuImage:backgroundImage};
}
/** Choose once per selection session; hover, confirmation and retry reuse this object. */
export function chooseStageVisual(stage:StageConfig):StageConfig {
  const backgrounds=STAGE_BACKGROUND_VARIANTS[stage.id];
  return backgrounds?withStageVisual(stage,stage.backgroundVariant??Math.floor(Math.random()*backgrounds.length)):stage;
}
