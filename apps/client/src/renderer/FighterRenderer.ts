import { Container } from 'pixi.js';
import type { PlayerState } from '@smash/shared';
import { getAnimationPose } from './animations.js';
import { createPartRenderer, slotToPattern } from './parts/index.js';
import { getPartTransforms } from './parts/poseAdapter.js';
import type { FighterPart, IPartRenderer, PatternDescriptor } from './parts/IPartRenderer.js';

type RenderableFighterState = Pick<
  PlayerState,
  'x' | 'y' | 'facing' | 'isInvincible' | 'state' | 'stateFrame' | 'slotIndex'
>;

/** Draw order for iterating parts (back-to-front). */
const PART_DRAW_ORDER: readonly FighterPart[] = [
  'LEG_L', 'LEG_R', 'BODY', 'ARM_L', 'ARM_R', 'HEAD',
] as const;

export class FighterRenderer {
  readonly container: Container;
  private readonly partRenderer: IPartRenderer;
  private readonly pattern: PatternDescriptor;
  private slotIndex: number;
  private lastState: string = '';
  private lastFrame: number = -1;

  constructor(parentContainer: Container, slotIndex: number) {
    this.slotIndex = slotIndex;
    this.container = new Container();
    this.partRenderer = createPartRenderer('polygon', slotIndex);
    this.pattern = slotToPattern(slotIndex);
    this.container.addChild(this.partRenderer.container);
    parentContainer.addChild(this.container);
  }

  update(player: RenderableFighterState): void {
    this.container.x = player.x;
    this.container.y = player.y;
    this.container.scale.x = player.facing; // flip for direction

    // Invincibility flicker
    this.container.alpha = (player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) ? 0.4 : 1.0;

    // Only redraw if state or frame changed
    if (player.state === this.lastState && player.stateFrame === this.lastFrame) return;
    this.lastState = player.state;
    this.lastFrame = player.stateFrame;

    this.redraw(player);
  }

  /** Get the display object for a specific part (for Wave 3 flash effects). */
  getPart(part: FighterPart): Container {
    return this.partRenderer.getDisplayObject(part);
  }

  private redraw(player: RenderableFighterState): void {
    const pose = getAnimationPose(player.state, player.stateFrame);
    const transforms = getPartTransforms(pose, this.slotIndex);

    for (const part of PART_DRAW_ORDER) {
      this.partRenderer.draw(part, transforms[part], this.pattern);
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
