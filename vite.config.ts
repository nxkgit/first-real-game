import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

// The short git commit, stamped into the game so a bug report says which build it came from
// (src/qa/buildInfo.ts). 'dev' when git is unavailable.
function buildId(): string {
  const fromCi = process.env.GITHUB_SHA?.slice(0, 7);
  if (fromCi) return fromCi;
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'dev';
  } catch {
    return 'dev';
  }
}

// The game is the main page; the content browser (content.html) is a second page that shares the
// same data files. The base path is still passed on the command line when deploying.
export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(buildId()) },
  // Agent worktrees live under .claude/; their copies of the tests must not run here.
  // testTimeout: the default 5000ms is too tight for the two heavy seeded-fuzz suites
  // (run.invariants.test.ts, sim/balance.test.ts), which already run thousands of simulated fights
  // and only grew heavier as the card registry grew; they were timing out under load even locally
  // (see HANDOFF.md) and started reliably timing out in CI once the Mage cards were added. Raised
  // again 2026-10-08 after enemy HP was doubled twice (093a6db, then again): sim/balance.test.ts
  // alone now measures ~46s on an otherwise-idle machine, so 30s was no longer enough even without load.
  test: { exclude: [...configDefaults.exclude, '.claude/**'], testTimeout: 60000 },
  build: {
    // Phaser is most of the bundle and rarely changes, so it gets its own file: a game-code
    // update then doesn't make returning players re-download it.
    rolldownOptions: {
      input: { main: 'index.html', content: 'content.html' },
      output: {
        codeSplitting: {
          groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }],
        },
      },
    },
  },
});
