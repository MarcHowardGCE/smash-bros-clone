import { Graphics, Container, Sprite, Texture } from 'pixi.js';
import { STAGE } from '@smash/shared';

// B&W colors
const COLOR_WHITE = 0xFFFFFF;
const COLOR_BLACK = 0x000000;
const STROKE_WIDTH = 2;

export class StageRenderer {
  private container: Container;

  constructor(parentContainer: Container) {
    this.container = new Container();
    parentContainer.addChild(this.container);
    this.drawStage();
  }

  private drawStage(): void {
    // Background image — cityscape behind everything
    this.drawBackground();

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
    this.container.addChildAt(grid, 1); // Above background (0), behind platforms (2+)
  }

  private drawBackground(): void {
    try {
      // Use Sprite.from() with proper error handling for PixiJS v8
      const bgSprite = Sprite.from('/backgrounds/cityscape.png');
      bgSprite.position.set(0, 0);
      bgSprite.width = STAGE.WIDTH;
      bgSprite.height = STAGE.HEIGHT;
      this.container.addChildAt(bgSprite, 0);
    } catch (error) {
      console.warn('[StageRenderer] Failed to load background image:', error);
    }
  }
}
