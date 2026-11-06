import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [vue()],
  server: {
    proxy: {
      '/webapi': {
        target: 'https://webapi.ctfile.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/webapi/, ''),
      },
      '/captcha_altcha.php': {
        target: 'https://webapi.ctfile.com',
        changeOrigin: true,
      },
    },
  },
})
