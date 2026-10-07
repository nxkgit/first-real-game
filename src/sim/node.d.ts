// Just the bits of Node's file API the simulator's command line uses (the game's tsconfig doesn't include Node's types).
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function writeFileSync(path: string, data: string): void;
}
