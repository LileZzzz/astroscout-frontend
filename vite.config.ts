import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three'
          }
          if (id.includes('SkySceneCanvas') || id.includes('types/sky101')) {
            return 'sky101-scene'
          }
          return undefined
        },
      },
    },
  },
})
