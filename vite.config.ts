import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Fake values so api.ts doesn't throw at import and tests never need a real .env.
    env: {
      VITE_API_BASE_URL: 'https://api.test',
      VITE_API_KEY: 'test-key',
    },
  },
})
