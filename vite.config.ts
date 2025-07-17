import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isRenderer = process.env.VITE_TARGET === 'renderer' || mode === 'development';
  
  if (isRenderer) {
    // Renderer process configuration
    return {
      plugins: [react(), tailwindcss()],
      root: 'src/renderer',
      base: './',
      build: {
        outDir: '../../dist-renderer',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'src/renderer/index.html'),
          },
        },
      },
      server: {
        port: 3000,
      },
    };
  } else {
    // Main process and preload configuration
    const isPreload = process.env.VITE_TARGET === 'preload';
    
    return {
      build: {
        lib: {
          entry: isPreload 
            ? resolve(__dirname, 'src/preload.ts')
            : resolve(__dirname, 'src/main.ts'),
          formats: [isPreload ? 'cjs' : 'es'], // Preload needs CommonJS, main can use ES
          fileName: () => isPreload ? 'preload.js' : 'main.js',
        },
        outDir: 'dist',
        emptyOutDir: false,
        target: 'node18',
        rollupOptions: {
          external: [
            'electron', 
            'node-pty',
            'path',
            'url', 
            'fs',
            'child_process',
            'os',
            'crypto',
            'util',
            'events'
          ],
        },
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    };
  }
}); 