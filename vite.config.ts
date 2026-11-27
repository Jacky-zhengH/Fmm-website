import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { SITE_ORIGIN } = loadEnv(mode, '.', 'SITE_')
  const origin = SITE_ORIGIN ? new URL(SITE_ORIGIN).origin : ''

  return {
    plugins: [
      vue(),
      {
        name: 'social-cover-origin',
        transformIndexHtml(html) {
          return html.replaceAll('%SITE_ORIGIN%', origin)
        },
      },
    ],
    server: { host: '127.0.0.1', port: 5173 },
    build: {
      rollupOptions: {
        input: {
          archive: 'index.html',
          nemu200: 'memories/nemu-200/index.html',
        },
      },
    },
  }
})
