import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import netlify from '@netlify/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ react(), netlify() ],
  proxy: {
    '/api': {
      target: 'http://localhost:5001', // your backend server URL
    },
  },
})
