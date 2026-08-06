/**
 * W3C Standard Gamepad mapping for Xbox-style controllers.
 * Provides button index constants, deadzone handling, and input bit sampling.
 */

/**
 * W3C Standard Gamepad button indices
 * Applies to Xbox One, PS4, and controllers mapping to "standard" layout
 */
export const STANDARD_BUTTON_INDEX = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  LS: 10,
  RS: 11,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
  GUIDE: 16,
} as const;

/**
 * Generic input bit flags (uint16) - package-local definition
 * Maps gamepad inputs to directional and action bits
 */
export const GenericInputBits = {
  LEFT:    0x0001,
  RIGHT:   0x0002,
  UP:      0x0004,
  DOWN:    0x0008,
  A:       0x0010,
  B:       0x0020,
  X:       0x0040,
  Y:       0x0080,
  LB:      0x0100,
  RB:      0x0200,
  LT:      0x0400,
  RT:      0x0800,
  START:   0x1000,
  BACK:    0x2000,
} as const;

export type GenericInputBitmask = number;

/**
 * Apply radial deadzone to analog stick input
 * Calculates magnitude, checks against deadzone threshold, and rescales
 *
 * @param x - horizontal axis value [-1, 1]
 * @param y - vertical axis value [-1, 1]
 * @param deadzone - magnitude threshold [0, 1], default 0.2
 * @returns [rescaledX, rescaledY] with magnitude >= deadzone or [0, 0]
 */
export function applyRadialDeadzone(
  x: number,
  y: number,
  deadzone: number = 0.2
): [number, number] {
  // Calculate magnitude
  const magnitude = Math.sqrt(x * x + y * y);

  // If within deadzone, return zero
  if (magnitude < deadzone) {
    return [0, 0];
  }

  // Rescale: (value / magnitude) * ((magnitude - deadzone) / (1 - deadzone))
  const scale = (magnitude - deadzone) / (1 - deadzone);
  return [
    (x / magnitude) * scale,
    (y / magnitude) * scale,
  ];
}

/**
 * Sample gamepad input and return generic input bitmask
 * Reads button states and left analog stick position
 *
 * @param gamepad - W3C Gamepad object
 * @param deadzone - analog stick deadzone, default 0.2
 * @returns GenericInputBitmask with button and direction bits set
 *
 * Returns 0 if gamepad is not "standard" mapping (no throw)
 * Left stick beyond 0.5 post-deadzone → directional bits
 * D-pad buttons (12-15) → directional bits OR'd with stick bits
 * Face/shoulder/trigger buttons → action bits
 */
export function sampleGamepadBits(
  gamepad: Gamepad | null | undefined,
  deadzone: number = 0.2
): GenericInputBitmask {
  // Validate gamepad and mapping
  if (!gamepad || gamepad.mapping !== 'standard') {
    return 0;
  }

  let bits: GenericInputBitmask = 0;

  // Sample left analog stick (axes 0, 1)
  const axes = gamepad.axes ?? [];
  const [stickX, stickY] = applyRadialDeadzone(
    axes[0] ?? 0,
    axes[1] ?? 0,
    deadzone
  );

  // Left stick beyond 0.5 threshold → directional bits
  if (stickX >= 0.45) {
    bits |= GenericInputBits.RIGHT;
  }
  if (stickX <= -0.45) {
    bits |= GenericInputBits.LEFT;
  }
  if (stickY >= 0.45) {
    bits |= GenericInputBits.DOWN;
  }
  if (stickY <= -0.45) {
    bits |= GenericInputBits.UP;
  }

  // Sample buttons (indices 0-16)
  const buttons = gamepad.buttons ?? [];

  // Face buttons
  if (buttons[STANDARD_BUTTON_INDEX.A]?.pressed) {
    bits |= GenericInputBits.A;
  }
  if (buttons[STANDARD_BUTTON_INDEX.B]?.pressed) {
    bits |= GenericInputBits.B;
  }
  if (buttons[STANDARD_BUTTON_INDEX.X]?.pressed) {
    bits |= GenericInputBits.X;
  }
  if (buttons[STANDARD_BUTTON_INDEX.Y]?.pressed) {
    bits |= GenericInputBits.Y;
  }

  // Shoulder buttons
  if (buttons[STANDARD_BUTTON_INDEX.LB]?.pressed) {
    bits |= GenericInputBits.LB;
  }
  if (buttons[STANDARD_BUTTON_INDEX.RB]?.pressed) {
    bits |= GenericInputBits.RB;
  }

  // Analog triggers
  if (buttons[STANDARD_BUTTON_INDEX.LT]?.pressed) {
    bits |= GenericInputBits.LT;
  }
  if (buttons[STANDARD_BUTTON_INDEX.RT]?.pressed) {
    bits |= GenericInputBits.RT;
  }

  // Menu buttons
  if (buttons[STANDARD_BUTTON_INDEX.BACK]?.pressed) {
    bits |= GenericInputBits.BACK;
  }
  if (buttons[STANDARD_BUTTON_INDEX.START]?.pressed) {
    bits |= GenericInputBits.START;
  }

  // D-pad buttons (12-15) → directional bits OR'd with stick bits
  if (buttons[STANDARD_BUTTON_INDEX.DPAD_UP]?.pressed) {
    bits |= GenericInputBits.UP;
  }
  if (buttons[STANDARD_BUTTON_INDEX.DPAD_DOWN]?.pressed) {
    bits |= GenericInputBits.DOWN;
  }
  if (buttons[STANDARD_BUTTON_INDEX.DPAD_LEFT]?.pressed) {
    bits |= GenericInputBits.LEFT;
  }
  if (buttons[STANDARD_BUTTON_INDEX.DPAD_RIGHT]?.pressed) {
    bits |= GenericInputBits.RIGHT;
  }

  return bits;
}
