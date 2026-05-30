import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
  ],
  optimizeDeps: {
    // mind-ar pre-built bundle must NOT be re-processed by Vite
    exclude: ['mind-ar'],
  },
  assetsInclude: ['**/*.mind', '**/*.glb'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
        },
      },
    },
    chunkSizeWarningLimit: 5000,
  },
  server: {
    https: true,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
