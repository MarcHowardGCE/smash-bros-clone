import { Container, Graphics } from 'pixi.js';
import type { PlayerState } from '@smash/shared';
import { getAnimationPose } from './animations.js';

type RenderableFighterState = Pick<
  PlayerState,
  'x' | 'y' | 'facing' | 'isInvincible' | 'state' | 'stateFrame' | 'slotIndex'
>;

// B&W colors
const COLOR_WHITE = 0xFFFFFF;
const COLOR_BLACK = 0x000000;
const OUTLINE_WIDTH = 2;

// Fighter dimensions
const BODY_RADIUS = 22;
const HEAD_RADIUS = 14;
const ARM_LENGTH = 22;
const ARM_WIDTH = 7;
const LEG_LENGTH = 24;
const LEG_WIDTH = 8;

export class FighterRenderer {
  readonly container: Container;
  private graphics: Graphics;
  private slotIndex: number;
  private lastState: string = '';
  private lastFrame: number = -1;

  constructor(parentContainer: Container, slotIndex: number) {
    this.slotIndex = slotIndex;
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
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

  private redraw(player: RenderableFighterState): void {
    this.graphics.clear();

    const pose = getAnimationPose(player.state, player.stateFrame);

    // Apply body squash/stretch
    const bw = BODY_RADIUS * pose.bodyScaleX;
    const bh = BODY_RADIUS * pose.bodyScaleY;

    // Draw legs first (behind body)
    this.drawLimb(0 - 8, 0 + bh * 0.6, pose.leftLegAngle, LEG_LENGTH, LEG_WIDTH);
    this.drawLimb(0 + 8, 0 + bh * 0.6, pose.rightLegAngle, LEG_LENGTH, LEG_WIDTH);

    // Draw body (pentagon)
    this.drawBody(bw, bh, this.slotIndex);

    // Draw arms (in front of body)
    this.drawLimb(0 - bw * 0.7, 0, pose.leftArmAngle - Math.PI / 2, ARM_LENGTH, ARM_WIDTH);
    this.drawLimb(0 + bw * 0.7, 0, pose.rightArmAngle - Math.PI / 2, ARM_LENGTH, ARM_WIDTH);

    // Draw head (on top)
    const hx = pose.headOffsetX;
    const hy = -bh * 1.0 + pose.headOffsetY;
    this.drawHead(hx, hy);
  }

  private drawBody(bw: number, bh: number, slotIndex: number): void {
    // Draw pentagon body
    const g = this.graphics;
    const sides = 5;
    const startAngle = -Math.PI / 2;
    
    g.moveTo(
      Math.cos(startAngle) * bw,
      Math.sin(startAngle) * bh
    );
    for (let i = 1; i <= sides; i++) {
      const angle = startAngle + (i * Math.PI * 2) / sides;
      g.lineTo(Math.cos(angle) * bw, Math.sin(angle) * bh);
    }
    g.closePath();

    // Fill pattern based on slot
    switch (slotIndex) {
      case 0:
        // Solid white
        g.fill({ color: COLOR_WHITE });
        break;
      case 1:
        // White with horizontal stripe pattern (simplified: half-opacity + stroke pattern)
        g.fill({ color: COLOR_WHITE });
        // Draw stripes overlay
        for (let y = -bh; y < bh; y += 8) {
          g.moveTo(-bw, y);
          g.lineTo(bw, y);
        }
        g.stroke({ color: COLOR_BLACK, width: 1.5, alpha: 0.5 });
        break;
      case 2:
        // White with dot overlay
        g.fill({ color: COLOR_WHITE });
        // Draw dots
        for (let dy = -bh + 6; dy < bh; dy += 10) {
          for (let dx = -bw + 6; dx < bw; dx += 10) {
            g.circle(dx, dy, 2);
          }
        }
        g.fill({ color: COLOR_BLACK, alpha: 0.6 });
        break;
      case 3:
        // White with crosshatch
        g.fill({ color: COLOR_WHITE });
        for (let d = -bw * 2; d < bw * 2; d += 9) {
          g.moveTo(d, -bh);
          g.lineTo(d + bh * 2, bh);
          g.moveTo(d, -bh);
          g.lineTo(d - bh * 2, bh);
        }
        g.stroke({ color: COLOR_BLACK, width: 1, alpha: 0.45 });
        break;
    }

    // Always draw outline
    g.moveTo(Math.cos(startAngle) * bw, Math.sin(startAngle) * bh);
    for (let i = 1; i <= sides; i++) {
      const angle = startAngle + (i * Math.PI * 2) / sides;
      g.lineTo(Math.cos(angle) * bw, Math.sin(angle) * bh);
    }
    g.closePath();
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });
  }

  private drawHead(hx: number, hy: number): void {
    const g = this.graphics;
    g.circle(hx, hy, HEAD_RADIUS);
    g.fill({ color: COLOR_WHITE });
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });
    
    // Simple eyes (two small dots)
    g.circle(hx + 4, hy - 3, 2.5);
    g.fill({ color: COLOR_BLACK });
  }

  private drawLimb(x: number, y: number, angle: number, length: number, width: number): void {
    const g = this.graphics;
    // Draw a rectangle rotated around its top-center
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const hw = width / 2;
    
    // Four corners of the limb rectangle
    const corners = [
      [-hw, 0],
      [hw, 0],
      [hw, length],
      [-hw, length],
    ] as const;
    
    // Rotate corners
    const rotated = corners.map(([cx, cy]) => [
      x + cx * cos - cy * sin,
      y + cx * sin + cy * cos,
    ] as const);
    
    const [p0, p1, p2, p3] = rotated;
    if (!p0 || !p1 || !p2 || !p3) {
      return;
    }

    g.moveTo(p0[0], p0[1]);
    g.lineTo(p1[0], p1[1]);
    g.lineTo(p2[0], p2[1]);
    g.lineTo(p3[0], p3[1]);
    g.closePath();
    g.fill({ color: COLOR_WHITE });
    g.stroke({ color: COLOR_BLACK, width: 1.5 });
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
