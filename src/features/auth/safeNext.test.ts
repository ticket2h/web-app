import { describe, expect, it } from 'vitest'

import { safeNext } from './safeNext'

describe('safeNext', () => {
  it('keeps paths inside the app', () => {
    expect(safeNext('/account?tab=1')).toBe('/account?tab=1')
  })

  it.each([null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'account'])(
    'falls back to / for %s',
    (next) => {
      expect(safeNext(next)).toBe('/')
    },
  )
})
