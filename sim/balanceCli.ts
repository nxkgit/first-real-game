import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { COMMANDS, USAGE, runCommand } from './commands';

// Entry point for `npm run balance -- <command> [flags]` (see commands.ts for what each does).
// Exit code is non-zero ONLY when the tool itself fails (bad flags, unreadable baseline, a crash).
// Balance movement is information for a human and never fails the command.

declare const process: { argv: string[]; exit(code: number): never };

function parseArgs(argv: string[]): { command: string | undefined; flags: Record<string, string> } {
  const flags: Record<string, string> = {};
  let command: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      command ??= arg;
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[arg.slice(2)] = 'true';
    else {
      flags[arg.slice(2)] = next;
      i++;
    }
  }
  return { command, flags };
}

function ensureDir(path: string): void {
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  if (slash > 0) mkdirSync(path.slice(0, slash), { recursive: true });
}

function main(): void {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (!command || !(COMMANDS as readonly string[]).includes(command)) {
    console.log(USAGE);
    if (command) throw new Error(`unknown command "${command}"`);
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const result = runCommand(command, flags, { readText: (p) => readFileSync(p, 'utf8') }, today);

  if (command === 'baseline') {
    const out = flags.out && flags.out !== 'true' ? flags.out : (result.defaultOut as string);
    ensureDir(out);
    writeFileSync(out, JSON.stringify(result.json, null, 1) + '\n');
    console.log(`${result.markdown}\nWrote ${out}`);
    return;
  }
  if (flags.out && flags.out !== 'true') {
    if (command === 'check') {
      ensureDir(flags.out);
      writeFileSync(flags.out, result.markdown + '\n');
      console.log(`Wrote ${flags.out}`);
    } else {
      ensureDir(`${flags.out}.md`);
      writeFileSync(`${flags.out}.md`, result.markdown + '\n');
      writeFileSync(`${flags.out}.json`, JSON.stringify(result.json, null, 1) + '\n');
      console.log(`Wrote ${flags.out}.md and ${flags.out}.json`);
    }
  }
  if (flags.json === 'true') console.log(JSON.stringify(result.json, null, 2));
  else if (!flags.out) console.log(result.markdown);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
