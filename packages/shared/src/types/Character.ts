/**
 * @fileoverview Character identity and per-character stat types.
 * `CharacterId` is the string union of all playable characters.
 * `CharacterStats` holds the per-character physics overrides that the engine
 * substitutes in place of the global `PHYSICS` defaults.
 */

/** String union of all playable character identifiers. */
export type CharacterId = 'all-rounder' | 'abe-lincoln';

/**
 * Per-character physics overrides applied by the engine in place of global
 * `PHYSICS` constants. Every field maps 1-to-1 to a `PHYSICS` property of
 * the same semantic meaning.
 */
export interface CharacterStats {
  /** Knockback formula weight divisor; higher = less knockback taken. */
  fighterWeight: number;
  /** Fighter collision sphere radius in px; used for both hurt and platform checks. */
  hurtboxRadius: number;
  /** Maximum horizontal ground speed in px/frame during run. */
  runSpeed: number;
  /** Maximum horizontal ground speed in px/frame during walk. */
  walkSpeed: number;
  /** Initial vertical velocity on full hop in px/frame (negative = upward). */
  jumpVelocity: number;
  /** Initial vertical velocity on short hop in px/frame (negative = upward). */
  shortHopVelocity: number;
}
