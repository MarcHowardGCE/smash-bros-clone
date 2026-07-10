import { Container } from 'pixi.js';

export interface GameLayers {
  background: Container;  // static stage geometry — never redrawn
  game: Container;        // fighters, dynamic elements — redrawn each frame
  ui: Container;          // effects on canvas — redrawn each frame
}

export function createLayers(): GameLayers {
  return {
    background: new Container(),
    game: new Container(),
    ui: new Container(),
  };
}
