/**
 * @fileoverview Stage geometry constants: blast zones, platforms, ledges, walls, and spawn positions.
 * All coordinates are in pixel-space with origin at the top-left of the 1280×720 viewport.
 * Positive x runs right; positive y runs downward.
 *
 * Blast zone summary (KO boundaries):
 * - Left:   x = −300
 * - Right:  x = 1580
 * - Top:    y = −200
 * - Bottom: y =  820
 *
 * Stage layout:
 * - One solid main platform spanning most of the width at y = 500
 * - Two soft (pass-through) platforms at y = 350, one left and one right
 * - Two ledge grab points at the left and right edges of the main platform
 * - Two inset walls at x = −260 and x = 1540 (40 px inside the blast zones)
 */

/**
 * Complete geometry definition for the single stage in the game.
 * The engine's collision and blast-zone systems read directly from this object.
 */
export const STAGE = {
  /** Stage viewport width in px. */
  WIDTH: 1280,
  /** Stage viewport height in px. */
  HEIGHT: 720,
  /** Top blast zone y coordinate; crossing above this KOs the fighter upward. */
  BLAST_TOP: -200,
  /** Bottom blast zone y coordinate; crossing below this KOs the fighter downward. */
  BLAST_BOTTOM: 820,
  /** Left blast zone x coordinate; crossing left of this KOs the fighter leftward. */
  BLAST_LEFT: -300,
  /** Right blast zone x coordinate; crossing right of this KOs the fighter rightward. */
  BLAST_RIGHT: 1580,
  /**
   * The solid main platform spanning nearly the full stage width.
   * Fighters cannot pass through this platform from any direction.
   */
  MAIN_PLATFORM: {
    x: 190,
    y: 500,
    width: 900,
    height: 20,
    solid: true,
  },
  /**
   * Soft pass-through platforms. `solid: false` means fighters can land from
   * above and drop through by holding the down input.
   */
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
  /**
   * Fighter spawn positions ordered by slot index (0–3).
   * Fighters fall from these positions onto the main platform on match start
   * and after each respawn.
   */
  SPAWN_POSITIONS: [
    { x: 415, y: 400 },
    { x: 865, y: 400 },
    { x: 640, y: 300 },
    { x: 640, y: 450 },
  ],
  /**
   * Ledge grab points at the left and right edges of the main platform.
   * Each `x` is the platform edge x coordinate; `y` matches the platform top surface.
   */
  LEDGES: [
    { id: 'left', x: 190, y: 500 },
    { id: 'right', x: 1090, y: 500 },
  ],
  /**
   * Wall collision planes inset 40 px inside each blast zone.
   * Inset gives players room to interact with walls (wall jump, wall tech)
   * before being KO'd. `yTop`/`yBottom` bound the vertical extent of each wall.
   *
   * Left wall:  x = BLAST_LEFT (−300) + 40 = −260
   * Right wall: x = BLAST_RIGHT (1580) − 40 = 1540
   */
  WALLS: [
    { id: 'left', x: -260, yTop: 400, yBottom: 780 },
    { id: 'right', x: 1540, yTop: 400, yBottom: 780 },
  ],
} as const;

/** Derived type of the `STAGE` constant object; useful for typed parameter passing. */
export type Stage = typeof STAGE;
