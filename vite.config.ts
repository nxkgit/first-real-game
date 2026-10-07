import { defineConfig } from 'vite';

// The game is the main page; the content browser (content.html) is a second page that shares the
// same data files. The base path is still passed on the command line when deploying.
export default defineConfig({
  build: {
    rollupOptions: {
      input: { main: 'index.html', content: 'content.html' },
    },
  },
});
