import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/mobile',
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    allowedHosts: ['living-likely-monster.ngrok-free.app'],
    hmr: {
      host: 'living-likely-monster.ngrok-free.app',
      protocol: 'wss',
      clientPort: 443,
      path: '/frontend/@vite',
    },
  },
});
