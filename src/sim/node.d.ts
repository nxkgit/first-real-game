// Just the bits of Node's file API the simulator's command line uses (the game's tsconfig doesn't include Node's types).
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  /** Raw bytes (only the reader the art test needs: a PNG's header). */
  export function readFileSync(path: string): { readUInt32BE(offset: number): number };
  export function existsSync(path: string): boolean;
  export function writeFileSync(path: string, data: string): void;
  export function readdirSync(path: string): string[];
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
}
