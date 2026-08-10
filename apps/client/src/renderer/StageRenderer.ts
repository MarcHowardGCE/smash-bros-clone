/**
 * @fileoverview Static stage geometry renderer.
 *
 * Draws the main platform, soft pass-through platforms, ledge markers, and a
 * subtle background grid into a single PixiJS Container. Everything is drawn
 * once in the constructor — no per-frame updates are needed because the stage
 * geometry never changes at runtime.
 */
import { Container, Graphics } from 'pixi.js';
import { STAGE } from '@smash/shared';

// B&W colors
const COLOR_WHITE = 0xFFFFFF;
const COLOR_BLACK = 0x000000;
const STROKE_WIDTH = 2;

/**
 * Renders static stage geometry: main platform, soft platforms, ledge markers,
 * and background grid. Geometry is drawn once at construction time.
 */
export class StageRenderer {
  private container: Container;

  /**
   * Create the stage renderer and immediately draw all geometry.
   *
   * @param parentContainer - PixiJS Container to attach stage graphics to
   */
  constructor(parentContainer: Container) {
    this.container = new Container();
    parentContainer.addChild(this.container);
    this.drawStage();
  }

  private drawStage(): void {
    // Main platform — solid white rectangle, black border
    const mainPlatform = new Graphics();
    mainPlatform.rect(
      STAGE.MAIN_PLATFORM.x,
      STAGE.MAIN_PLATFORM.y,
      STAGE.MAIN_PLATFORM.width,
      STAGE.MAIN_PLATFORM.height
    );
    mainPlatform.fill({ color: COLOR_WHITE });
    mainPlatform.stroke({ color: COLOR_BLACK, width: STROKE_WIDTH });
    this.container.addChild(mainPlatform);

    // Ledge markers
    for (const ledge of STAGE.LEDGES) {
      const marker = new Graphics();
      const size = 6;
      marker.moveTo(ledge.x, ledge.y - size);
      marker.lineTo(ledge.x + size, ledge.y);
      marker.lineTo(ledge.x, ledge.y + size);
      marker.lineTo(ledge.x - size, ledge.y);
      marker.closePath();
      marker.fill({ color: COLOR_WHITE });
      marker.stroke({ color: COLOR_BLACK, width: STROKE_WIDTH });
      this.container.addChild(marker);
    }

    // Soft platforms — lighter visual (semi-transparent white or dashed appearance)
    for (const platform of STAGE.PLATFORMS) {
      const softPlatform = new Graphics();
      // Draw platform as a thinner white bar with dashed outline to indicate pass-through
      softPlatform.rect(platform.x, platform.y, platform.width, platform.height);
      softPlatform.fill({ color: COLOR_WHITE, alpha: 0.7 });
      softPlatform.stroke({ color: COLOR_WHITE, width: STROKE_WIDTH });
      this.container.addChild(softPlatform);

      // Draw small triangles/markers below to indicate "pass-through"
      const marker = new Graphics();
      const cx = platform.x + platform.width / 2;
      const cy = platform.y + platform.height + 6;
      marker.moveTo(cx - 8, cy);
      marker.lineTo(cx + 8, cy);
      marker.lineTo(cx, cy + 8);
      marker.closePath();
      marker.fill({ color: COLOR_WHITE, alpha: 0.5 });
      this.container.addChild(marker);
    }

    // Draw subtle background grid lines (aesthetic only)
    this.drawBackgroundGrid();
  }

  private drawBackgroundGrid(): void {
    const grid = new Graphics();
    const gridSpacing = 80;
    const gridColor = 0x333333;
    const gridAlpha = 0.3;

    // Vertical lines
    for (let x = 0; x <= STAGE.WIDTH; x += gridSpacing) {
      grid.moveTo(x, 0);
      grid.lineTo(x, STAGE.HEIGHT);
    }
    // Horizontal lines
    for (let y = 0; y <= STAGE.HEIGHT; y += gridSpacing) {
      grid.moveTo(0, y);
      grid.lineTo(STAGE.WIDTH, y);
    }
    grid.stroke({ color: gridColor, width: 1, alpha: gridAlpha });
    this.container.addChildAt(grid, 0); // Behind platforms
  }
}
