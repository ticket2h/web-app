import { describe, expect, it } from 'vitest'

import { isRepeatScan } from './result'

describe('isRepeatScan', () => {
  it('ignores the same code seen again within the window', () => {
    expect(isRepeatScan({ token: 'a', at: 1000 }, 'a', 3000)).toBe(true)
  })

  it('accepts the same code after the window, or a different code at once', () => {
    expect(isRepeatScan({ token: 'a', at: 1000 }, 'a', 6000)).toBe(false)
    expect(isRepeatScan({ token: 'a', at: 1000 }, 'b', 1100)).toBe(false)
    expect(isRepeatScan(null, 'a', 0)).toBe(false)
  })
})
