export interface PlatformData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  solid: boolean;
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
  spawnPositions: Array<{ x: number; y: number }>;
}
