// Set by vite.config.ts at build time (the short git commit). Not defined when the code runs
// outside a Vite build, so every reader goes through `BUILD_ID` below.
declare const __BUILD_ID__: string | undefined;

/** Which build of the game this is, so a report says exactly what the tester was playing. */
export const BUILD_ID: string = typeof __BUILD_ID__ === 'string' && __BUILD_ID__ !== '' ? __BUILD_ID__ : 'dev';
