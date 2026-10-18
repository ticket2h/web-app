import type { LoginResponse, User } from '../api/types'

/**
 * Phiên đăng nhập. Access token chỉ nằm trong bộ nhớ (không localStorage): tải lại trang thì lấy token mới bằng
 * refresh token trong cookie httpOnly (identity-service, POST /auth/refresh). JavaScript không đọc được cookie đó.
 */
export interface Session {
  accessToken: string
  /** Mốc hết hạn của access token, epoch ms. */
  expiresAt: number
  user: User
}

const REFRESH_URL = '/api/identity/auth/refresh'
const LOGOUT_URL = '/api/identity/auth/logout'
/** Làm mới sớm hơn hạn thật một chút để request đang bay không gặp token vừa hết hạn. */
const EXPIRY_MARGIN_MS = 30_000
/** identity xoay vòng refresh token mỗi lần dùng: các tab phải refresh lần lượt (README của identity-service). */
const REFRESH_LOCK = 'ticket2h-refresh'

let session: Session | null = null
let refreshing: Promise<Session | null> | null = null
const listeners = new Set<() => void>()

export function getSession(): Session | null {
  return session
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function startSession(login: LoginResponse, now = Date.now()): Session {
  setSession({ accessToken: login.accessToken, expiresAt: now + login.expiresIn * 1000, user: login.user })
  return session!
}

export function clearSession(): void {
  setSession(null)
}

/**
 * Access token còn dùng được, tự làm mới nếu sắp hết hạn. `null` khi chưa đăng nhập: không gọi refresh cho khách,
 * việc khôi phục phiên lúc mở trang do {@link refreshSession} làm một lần.
 */
export async function getAccessToken(now = Date.now()): Promise<string | null> {
  if (!session) {
    return null
  }
  if (session.expiresAt - EXPIRY_MARGIN_MS > now) {
    return session.accessToken
  }
  return (await refreshSession())?.accessToken ?? null
}

/** Đổi cookie refresh lấy access token mới. Gọi trùng trong một tab thì dùng chung một request. */
export function refreshSession(): Promise<Session | null> {
  refreshing ??= withRefreshLock(doRefresh).finally(() => {
    refreshing = null
  })
  return refreshing
}

export async function logout(): Promise<void> {
  try {
    await fetch(LOGOUT_URL, { method: 'POST', credentials: 'same-origin' })
  } finally {
    clearSession()
  }
}

async function doRefresh(): Promise<Session | null> {
  const response = await fetch(REFRESH_URL, { method: 'POST', credentials: 'same-origin' })
  if (!response.ok) {
    clearSession()
    return null
  }
  return startSession((await response.json()) as LoginResponse)
}

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  // Web Locks có ở mọi trình duyệt hiện đại; thiếu (jsdom, trình duyệt cũ) thì chạy thẳng
  return typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request(REFRESH_LOCK, task)
    : task()
}

function setSession(next: Session | null): void {
  session = next
  listeners.forEach((listener) => listener())
}
