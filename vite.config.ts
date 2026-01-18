import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // Siempre '/' en Vercel
  plugins: [react()],
})
