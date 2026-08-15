import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxies /api/* to the Flask backend during `npm run dev` so the
    // browser never has to deal with cross-origin requests. If you'd
    // rather call Flask directly, delete this block and set
    // VITE_API_BASE_URL in a .env file instead (see INTEGRATION.md).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
