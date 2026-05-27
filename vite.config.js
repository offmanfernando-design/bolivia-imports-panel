import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy /api hacia el backend — las requests del navegador van a 5173/api/*
    // y Vite las reenvía server→server a localhost:3000/api/*.
    // Esto evita CORS sin importar desde qué IP se abra el dev server.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
