import vue from '@vitejs/plugin-vue'
import { createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const localDocument = fileURLToPath(new URL('./local-media/document-web.mp3', import.meta.url))
const localRoute = '/__local-document.mp3'
const localFiles = new Map([
  [localRoute, { path: localDocument, type: 'audio/mpeg' }],
  ['/__local-document.ja.lrc', {
    path: fileURLToPath(new URL('./local-media/document.ja.lrc', import.meta.url)),
    type: 'text/plain; charset=utf-8',
  }],
  ['/__local-document.zh.lrc', {
    path: fileURLToPath(new URL('./local-media/document.zh.lrc', import.meta.url)),
    type: 'text/plain; charset=utf-8',
  }],
])

export default defineConfig(({ mode, command, isPreview }) => {
  const { SITE_ORIGIN } = loadEnv(mode, '.', 'SITE_')
  const origin = SITE_ORIGIN ? new URL(SITE_ORIGIN).origin : ''
  const localAudio = command === 'serve' && !isPreview && statSync(localDocument, { throwIfNoEntry: false })?.isFile()
  const internalReview = command === 'build' && process.env.CF_PAGES_BRANCH === 'codex/internal-review'

  return {
    define: {
      __LOCAL_DOCUMENT_AUDIO__: JSON.stringify(localAudio ? localRoute : ''),
      __INTERNAL_REVIEW__: JSON.stringify(internalReview),
    },
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
            const file = localFiles.get(request.url?.split('?')[0] ?? '')
            if (!file) return next()
            const remote = request.socket.remoteAddress
            const host = request.headers.host ?? ''
            if (!localAudio || !remote || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote) ||
                !/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/i.test(host)) {
              response.writeHead(404).end()
              return
            }
            if (request.method !== 'GET' && request.method !== 'HEAD') {
              response.writeHead(405, { Allow: 'GET, HEAD' }).end()
              return
            }
            const size = statSync(file.path, { throwIfNoEntry: false })?.size
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
            response.setHeader('Content-Type', file.type)
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
            const stream = createReadStream(file.path, { start, end })
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
          nemu200Preview: 'memories/nemu-200/preview/index.html',
        },
      },
    },
  }
})
