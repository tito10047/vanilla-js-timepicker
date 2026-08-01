import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/vanilla-js-timepicker/demo/',
  build: {
    rollupOptions: {
      input: 'examples/index.html',
    },
    outDir: 'dist-examples',
    emptyOutDir: true,
  },
});
