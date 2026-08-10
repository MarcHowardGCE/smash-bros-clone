/**
 * @fileoverview PixiJS scene layer factory.
 *
 * Creates the three render layers used by the client:
 * - `background` — static stage geometry, drawn once at match start
 * - `game` — fighters and dynamic effects, redrawn every frame
 * - `ui` — canvas-layer effects (e.g. flash overlays), redrawn every frame
 *
 * Callers add each layer to the PixiJS stage in back-to-front order.
 */
import { Container } from 'pixi.js';

/** Three PixiJS Containers representing the scene's render layers. */
export interface GameLayers {
  background: Container;  // static stage geometry — never redrawn
  game: Container;        // fighters, dynamic elements — redrawn each frame
  ui: Container;          // effects on canvas — redrawn each frame
}

/**
 * Create the three scene layers. Add them to the PixiJS stage in order:
 * background first, then game, then ui.
 *
 * @returns A {@link GameLayers} object with three fresh Containers
 */
export function createLayers(): GameLayers {
  return {
    background: new Container(),
    game: new Container(),
    ui: new Container(),
  };
}
