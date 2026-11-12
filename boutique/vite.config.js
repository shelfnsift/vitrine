import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages projet : base = /<nom-du-depot>/
  base: process.env.NODE_ENV === 'production' ? '/vitrine/' : '/',
})
