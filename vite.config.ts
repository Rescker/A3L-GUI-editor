import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/A3L-GUI-editor/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
