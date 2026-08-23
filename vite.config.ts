import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/NE5-Deskpet-NEO/',
  plugins: [vue()],
  server: { port: 5190 },
  test: { environment: 'node' }
})
