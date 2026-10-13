import Phaser from 'phaser';

// Every scene is laid out in a fixed 800x600 logical coordinate space. The page shows that
// layout scaled to fit the browser window (phones included), and the canvas is rendered at
// the real device-pixel size of that on-screen area so nothing is stretched — stretching a
// smaller canvas is what made text blurry on high-DPI / OS-scaled displays. Each scene's
// camera zooms by the same factor, so layout code never has to know the actual size.

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
const DPR = window.devicePixelRatio || 1;

/** Canvas size in device pixels for the current window: the 800x600 layout fitted inside it. */
export function fittedCanvasSize(): { width: number; height: number } {
  const cssScale = Math.max(0.25, Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT));
  return {
    width: Math.round(GAME_WIDTH * cssScale * DPR),
    height: Math.round(GAME_HEIGHT * cssScale * DPR),
  };
}

/** CSS zoom for the game config: shows the device-pixel canvas at its CSS size. */
export const CANVAS_ZOOM = 1 / DPR;

/** Keeps the canvas fitted to the window as it resizes. Call once after creating the game. */
export function fitGameToWindow(game: Phaser.Game): void {
  window.addEventListener('resize', () => {
    const { width, height } = fittedCanvasSize();
    game.scale.resize(width, height);
  });
}

/**
 * Call at the top of every scene's create(): zooms the camera so the scene can be laid out in
 * 800x600 coordinates, and renders all its text at the matching resolution — now and after
 * any window resize.
 */
export function useLayoutCamera(scene: Phaser.Scene): void {
  const zoom = (): number => scene.scale.width / GAME_WIDTH;

  const apply = (): void => {
    scene.cameras.main.setZoom(zoom()).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    setTextResolution(scene.children.list, zoom());
  };
  const onAdded = (obj: Phaser.GameObjects.GameObject): void => {
    if (obj instanceof Phaser.GameObjects.Text) obj.setResolution(zoom());
  };

  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded);
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded);
    scene.scale.off(Phaser.Scale.Events.RESIZE, apply);
  });
  apply();
}

function setTextResolution(objects: Phaser.GameObjects.GameObject[], resolution: number): void {
  for (const obj of objects) {
    if (obj instanceof Phaser.GameObjects.Text) obj.setResolution(resolution);
    else if (obj instanceof Phaser.GameObjects.Container) setTextResolution(obj.list, resolution);
  }
}
