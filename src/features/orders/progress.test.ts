import { describe, expect, it } from 'vitest'

import { orderSteps, parsePaymentReturn } from './progress'

describe('orderSteps', () => {
  it('waits on payment while the order is pending', () => {
    expect(orderSteps('PENDING_PAYMENT').map((s) => s.state)).toEqual(['done', 'current', 'upcoming'])
  })

  it('is waiting for tickets once paid', () => {
    expect(orderSteps('PAID').map((s) => s.state)).toEqual(['done', 'done', 'current'])
  })

  it('stops at payment for expired and cancelled orders', () => {
    expect(orderSteps('EXPIRED')[1]!.state).toBe('stopped')
    expect(orderSteps('CANCELLED')[1]!.state).toBe('stopped')
  })
})

describe('parsePaymentReturn', () => {
  it('only accepts known values', () => {
    expect(parsePaymentReturn('success')).toBe('success')
    expect(parsePaymentReturn('failed')).toBe('failed')
    expect(parsePaymentReturn('<script>')).toBeNull()
    expect(parsePaymentReturn(null)).toBeNull()
  })
})
