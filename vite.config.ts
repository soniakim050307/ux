import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' keeps asset paths relative, so the build works on Vercel,
// Netlify, GitHub Pages (project sites) and any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true },
})
