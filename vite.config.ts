import { defineConfig } from 'vite';

// The game is the main page; the content browser (content.html) is a second page that shares the
// same data files. The base path is still passed on the command line when deploying.
export default defineConfig({
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
