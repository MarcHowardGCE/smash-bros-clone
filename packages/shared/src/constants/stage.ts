export const STAGE = {
  WIDTH: 1280,
  HEIGHT: 720,
  BLAST_TOP: -200,
  BLAST_BOTTOM: 820,
  BLAST_LEFT: -300,
  BLAST_RIGHT: 1580,
  MAIN_PLATFORM: {
    x: 190,
    y: 500,
    width: 900,
    height: 20,
    solid: true,
  },
  PLATFORMS: [
    {
      id: 'left',
      x: 240,
      y: 350,
      width: 200,
      height: 15,
      solid: false,
    },
    {
      id: 'right',
      x: 840,
      y: 350,
      width: 200,
      height: 15,
      solid: false,
    },
  ],
  SPAWN_POSITIONS: [
    { x: 415, y: 400 },
    { x: 865, y: 400 },
    { x: 640, y: 300 },
    { x: 640, y: 450 },
  ],
  LEDGES: [
    { id: 'left', x: 190, y: 500 },
    { id: 'right', x: 1090, y: 500 },
  ],
} as const;

export type Stage = typeof STAGE;
