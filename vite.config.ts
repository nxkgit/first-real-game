import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

// The game is the main page; the content browser (content.html) is a second page that shares the
// same data files. The base path is still passed on the command line when deploying.
export default defineConfig({
  // Agent worktrees live under .claude/; their copies of the tests must not run here.
  // testTimeout: the default 5000ms is too tight for the two heavy seeded-fuzz suites
  // (run.invariants.test.ts, sim/balance.test.ts), which already run thousands of simulated fights
  // and only grew heavier as the card registry grew; they were timing out under load even locally
  // (see HANDOFF.md) and started reliably timing out in CI once the Mage cards were added.
  test: { exclude: [...configDefaults.exclude, '.claude/**'], testTimeout: 30000 },
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
