import { formatIssues, validateContent } from './validate';
import { realWorld } from './world';

// Entry point for `npm run content:check [-- --info] [-- --strict]`.
//   --info    also list notes (facts that are often intended, e.g. engine test cards)
//   --strict  exit non-zero on warnings too (default: only on errors)
// Exit code 1 means the content is broken; warnings are for a human to read.

declare const process: { argv: string[]; exit(code: number): never };

const flags = new Set(process.argv.slice(2));
const issues = validateContent(realWorld());
console.log(formatIssues(issues, { showInfo: flags.has('--info') }));
const errors = issues.filter((i) => i.severity === 'error').length;
const warnings = issues.filter((i) => i.severity === 'warning').length;
process.exit(errors > 0 || (flags.has('--strict') && warnings > 0) ? 1 : 0);
