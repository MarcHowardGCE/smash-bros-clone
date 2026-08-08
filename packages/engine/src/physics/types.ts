export interface PlatformData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  solid: boolean;
}

export interface LedgeData {
  id: string;
  x: number;
  y: number;
}

export interface WallData {
  id: string;
  x: number;
  yTop: number;
  yBottom: number;
}

export interface StageData {
  width: number;
  height: number;
  blastTop: number;
  blastBottom: number;
  blastLeft: number;
  blastRight: number;
  mainPlatform: PlatformData;
  platforms: PlatformData[];
  ledges: LedgeData[];
  walls: WallData[];
  spawnPositions: Array<{ x: number; y: number }>;
}
