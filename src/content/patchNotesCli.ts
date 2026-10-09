import { readFileSync, writeFileSync } from 'node:fs';
import { readmeIsCurrent, syncReadme } from './patchNotes';

// Entry point for `npm run patchnotes:sync`: copies the newest PATCHNOTES.md entry into the
// "Latest changes" block of README.md (the page GitHub shows first). Run it after adding an entry
// to PATCHNOTES.md. `--check` only reports whether the README is current (exit code 1 if not).

declare const process: { argv: string[]; exit(code: number): never };

const notes = readFileSync('PATCHNOTES.md', 'utf8');
const readme = readFileSync('README.md', 'utf8');
if (process.argv.slice(2).includes('--check')) {
  const current = readmeIsCurrent(readme, notes);
  console.log(current ? 'README.md shows the latest patch notes.' : 'README.md is behind PATCHNOTES.md: run npm run patchnotes:sync.');
  process.exit(current ? 0 : 1);
}
writeFileSync('README.md', syncReadme(readme, notes));
console.log('README.md now shows the latest patch notes entry.');
