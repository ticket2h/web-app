import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** Giống nginx: không mở /internal/** và actuator của service ra trình duyệt. */
function blockInternalApis(): Plugin {
  const blocked = /^\/api\/[^/]+\/+(internal|actuator)(\/|$|\?)/
  return {
    name: 'ticket2h-block-internal-apis',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        let path: string
        try {
          path = decodeURIComponent(req.url ?? '').replace(/\/{2,}/g, '/')
        } catch {
          res.statusCode = 400
          res.end()
          return
        }
        if (blocked.test(path)) {
          res.statusCode = 404
          res.end()
          return
        }
        next()
      })
    },
  }
}

// Địa chỉ service khi chạy bằng ./mvnw. Đổi bằng biến môi trường nếu chạy ở chỗ khác.
const identity = process.env.IDENTITY_URL ?? 'http://localhost:8082'
const core = process.env.CORE_URL ?? 'http://localhost:8080'

// Dev server làm gateway giống nginx/default.conf.template: trình duyệt chỉ gọi một origin, không cần CORS.
export default defineConfig({
  plugins: [react(), tailwindcss(), blockInternalApis()],
  resolve: {
    // momi-ui cài từ git: không để có hai bản React
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api/identity': {
        target: identity,
        rewrite: (path) => path.replace(/^\/api\/identity/, ''),
        // identity đặt cookie refresh ở Path=/auth; trình duyệt thấy nó dưới /api/identity/auth
        cookiePathRewrite: { '/auth': '/api/identity/auth' },
      },
      '/api/core': {
        target: core,
        rewrite: (path) => path.replace(/^\/api\/core/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
