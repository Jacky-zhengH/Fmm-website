import vue from '@vitejs/plugin-vue'
import { createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const localDocument = fileURLToPath(new URL('./local-media/document-web.mp3', import.meta.url))
const localRoute = '/__local-document.mp3'

export default defineConfig(({ mode, command, isPreview }) => {
  const { SITE_ORIGIN } = loadEnv(mode, '.', 'SITE_')
  const origin = SITE_ORIGIN ? new URL(SITE_ORIGIN).origin : ''
  const localAudio = command === 'serve' && !isPreview && statSync(localDocument, { throwIfNoEntry: false })?.isFile()

  return {
    define: { __LOCAL_DOCUMENT_AUDIO__: JSON.stringify(localAudio ? localRoute : '') },
    plugins: [
      vue(),
      {
        name: 'social-cover-origin',
        transformIndexHtml(html) {
          return html.replaceAll('%SITE_ORIGIN%', origin)
        },
      },
      {
        name: 'local-document-preview',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            if (request.url?.split('?')[0] !== localRoute) return next()
            const remote = request.socket.remoteAddress
            if (!localAudio || !remote || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) {
              response.writeHead(404).end()
              return
            }
            if (request.method !== 'GET' && request.method !== 'HEAD') {
              response.writeHead(405, { Allow: 'GET, HEAD' }).end()
              return
            }
            const size = statSync(localDocument, { throwIfNoEntry: false })?.size
            if (!size) {
              response.writeHead(404).end()
              return
            }
            const range = request.headers.range
            const match = range?.match(/^bytes=(\d*)-(\d*)$/)
            const start = match ? (match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]))) : 0
            const end = match?.[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
            if (range && (!match || start >= size || end < start)) {
              response.writeHead(416, { 'Content-Range': `bytes */${size}` }).end()
              return
            }
            response.setHeader('Content-Type', 'audio/mpeg')
            response.setHeader('Accept-Ranges', 'bytes')
            response.setHeader('Cache-Control', 'no-store')
            response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
            response.setHeader('Content-Length', end - start + 1)
            if (range) response.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
            response.statusCode = range ? 206 : 200
            if (request.method === 'HEAD') {
              response.end()
              return
            }
            const stream = createReadStream(localDocument, { start, end })
            stream.on('error', () => response.destroy())
            response.on('close', () => stream.destroy())
            stream.pipe(response)
          })
        },
      },
    ],
    server: {
      host: '127.0.0.1',
      port: 5173,
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/local-media/**'] },
    },
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
