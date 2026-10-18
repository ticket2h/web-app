import { useSyncExternalStore } from 'react'

import { getSession, subscribe, type Session } from './session'

/** Phiên hiện tại; component vẽ lại khi đăng nhập, làm mới token hoặc đăng xuất. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, getSession)
}
