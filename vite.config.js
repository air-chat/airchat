// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 ДОДАЙТЕ ЦЕЙ РЯДОК (замініть 'airchat' на точну назву вашого репозиторію)
  base: '/airchat/',
})