import { describe, expect, it } from 'vitest'

import { formatVndCompact } from '../../shared/format/money'
import { axisLabelIndices, dailySeries, niceTicks, saleDayLabel, share } from './sales'

const row = (key: string, revenue: number) => ({ key, label: null, orders: 1, tickets: 1, revenue })

describe('sales helpers', () => {
  it('fills days without sales so the time axis stays honest', () => {
    const series = dailySeries([row('2026-11-03', 30), row('2026-10-31', 10), row('2026-11-01', 20)])

    expect(series.map((r) => r.key)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'])
    expect(series[2]).toMatchObject({ revenue: 0, tickets: 0, orders: 0 })
    expect(dailySeries([])).toEqual([])
  })

  it('labels sale days with the weekday, without shifting the date by the browser time zone', () => {
    expect(saleDayLabel('2026-10-21')).toBe('T4, 21/10/2026')
    expect(saleDayLabel('2026-11-01', false)).toBe('CN, 01/11')
  })

  it('picks round axis ticks that cover the maximum', () => {
    expect(niceTicks(0)).toEqual([0])
    expect(niceTicks(95)).toEqual([0, 25, 50, 75, 100])
    expect(niceTicks(1_250_000_000)).toEqual([0, 500_000_000, 1_000_000_000, 1_500_000_000])
    expect(niceTicks(400)).toEqual([0, 100, 200, 300, 400])
  })

  it('formats money compactly in Vietnamese units', () => {
    expect(formatVndCompact(950_000)).toBe('950 N')
    expect(formatVndCompact(12_500_000)).toBe('12,5 tr')
    expect(formatVndCompact(350_000_000)).toBe('350 tr')
    expect(formatVndCompact(1_200_000_000)).toBe('1,2 tỷ')
    expect(formatVndCompact(0)).toBe('0')
  })

  it('spreads axis labels evenly and never squeezes one against the last day', () => {
    expect(axisLabelIndices(14, 6)).toEqual([0, 3, 6, 9, 13])
    expect(axisLabelIndices(4, 6)).toEqual([0, 1, 2, 3])
    expect(axisLabelIndices(1, 6)).toEqual([0])
    expect(axisLabelIndices(46, 6)).toEqual([0, 8, 16, 24, 32, 40, 45])
  })

  it('formats shares with one decimal', () => {
    expect(share(1, 8)).toBe('12,5%')
    expect(share(5, 0)).toBe('0%')
  })
})
