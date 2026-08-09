export interface StageConfig {
  id: string;
  displayName: string;
  backgroundImage: string;
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

export function getRandomStage(): StageConfig {
  const randomIndex = Math.floor(Math.random() * STAGES.length);
  return STAGES[randomIndex]!;
}

export function getStageById(id: string): StageConfig | undefined {
  return STAGES.find((stage) => stage.id === id);
}
