import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [
    react(),
    
    nodePolyfills({
      include: ['buffer']
    }),
    mkcert()
  ],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5175,
    open: true,
    https: {
    },
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  resolve: {
    alias: {
      '@': '/src',
    }
  }
});

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import {nodePolyfills} from "vite-plugin-node-polyfills";

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//       react(),
//     nodePolyfills({
//       include: ['buffer']
//     })
//   ],
//   base: '/'
// })