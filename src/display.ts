// The game is laid out in a fixed 800x600 logical coordinate space. On high-DPI
// or OS-scaled displays (e.g. Windows at 125%/150%), a canvas of that size gets
// stretched by the browser and everything — text especially — looks blurry.
// Instead, the canvas is rendered at device-pixel size, shrunk back to 800x600
// CSS pixels, and each scene's camera zooms by DPR so layout code is unchanged.

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const DPR = window.devicePixelRatio || 1;
