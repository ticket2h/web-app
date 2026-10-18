import createClient, { type Middleware } from 'openapi-fetch'

import { getAccessToken } from '../auth/session'
import type { paths as CorePaths } from './generated/core'
import type { paths as IdentityPaths } from './generated/identity'

/** Gắn access token (nếu đã đăng nhập). Đường dẫn công khai của BE bỏ qua header này. */
const bearerAuth: Middleware = {
  async onRequest({ request }) {
    const token = await getAccessToken()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
}

/**
 * Trình duyệt chỉ gọi một origin. /api/identity và /api/core do gateway chuyển tiếp: nginx khi chạy image,
 * proxy của Vite khi dev (vite.config.ts).
 */
export const identityApi = createClient<IdentityPaths>({ baseUrl: apiUrl('/api/identity'), fetch: callFetch })
export const coreApi = createClient<CorePaths>({ baseUrl: apiUrl('/api/core'), fetch: callFetch })

identityApi.use(bearerAuth)
coreApi.use(bearerAuth)

/** openapi-fetch giữ `fetch` từ lúc tạo client; tra lại mỗi lần gọi để test thay được `globalThis.fetch`. */
function callFetch(request: Request): Promise<Response> {
  return globalThis.fetch(request)
}

/** URL tuyệt đối trên origin hiện tại: `Request` của Node (test) không nhận đường dẫn tương đối. */
function apiUrl(path: string): string {
  return new URL(path, window.location.origin).href
}
