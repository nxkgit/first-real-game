// Just the bits of Node's API the card commands use (the game's tsconfig does not include Node's types).
// `node:fs` is declared once, in sim/node.d.ts.
declare module 'node:child_process' {
  export function spawnSync(
    command: string,
    args: string[],
    options?: { cwd?: string; encoding?: 'utf8'; maxBuffer?: number },
  ): { status: number | null; stdout: string; stderr: string };
}
declare module 'node:path' {
  const path: { join(...parts: string[]): string; dirname(p: string): string };
  export default path;
}
declare module 'node:process' {
  const process: { argv: string[]; cwd(): string; exit(code: number): never };
  export default process;
}
