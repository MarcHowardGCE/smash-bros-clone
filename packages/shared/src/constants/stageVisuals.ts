/** Cosmetic selections shared by menus and room setup; never used by simulation. */
export const STAGE_BACKGROUND_VARIANTS: Readonly<Record<string, readonly string[]>> = {
  stage10: ['stage10-studio.webp', 'stage10-archive.webp', 'stage10-broadcast.webp'],
};
export function isStageBackgroundVariant(stageId:string, value:unknown):value is number {
  return typeof value==='number' && Number.isInteger(value) && value>=0 && value<(STAGE_BACKGROUND_VARIANTS[stageId]?.length??1);
}
