// The app-entry tests exercise wiring without a browser canvas renderer.
export class Container {
  scale = { set: () => {} };
  position = { set: () => {} };

  addChild<T>(child: T): T {
    return child;
  }
}

export class Application {
  stage = new Container();
  canvas = document.createElement("canvas");
  screen = { width: 1280, height: 720 };
  renderer = { resize: () => {} };
  ticker = { add: () => {}, stop: () => {}, start: () => {} };

  async init(): Promise<void> {}
}
