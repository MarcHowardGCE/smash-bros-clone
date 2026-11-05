/**
 * Launch-speed influence from Rubendal's SSBU calculator LSI formula.
 * Inputs use this engine's normalized stick convention: positive Y is up.
 * This multiplier does not calibrate world-space launch speed or gravity.
 */
export function launchSpeedInfluence(inputY: number, launchAngle: number, tumble: boolean): number {
  if (!tumble || !Number.isFinite(inputY) || !Number.isFinite(launchAngle)) return 1;
  const degrees = ((launchAngle * 180 / Math.PI) % 360 + 360) % 360;
  // Strict intervals: exact boundary angles remain eligible.
  if ((degrees > 65 && degrees < 115) || (degrees > 245 && degrees < 295)) return 1;
  const y = Math.max(-1, Math.min(1, inputY));
  return y >= 0 ? 1 + 0.095 * y : 1 + 0.08 * y;
}
