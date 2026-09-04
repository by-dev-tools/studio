import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  server: { port: 5177, strictPort: true },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '~blueprints': path.resolve(import.meta.dirname, './blueprints'),
      '~contributors': path.resolve(import.meta.dirname, './contributors'),
    },
  },
})
