import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Base path: served at a subpath on GitHub Pages (project site), root during local dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/merlin-fleet-prototype/' : '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { host: true, port: 5180 },
}))
