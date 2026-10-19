import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'
import { signIn } from '../../test/session'

describe('CheckinPage', () => {
  it('checks a pasted code at the gate from the URL and keeps a history', async () => {
    signIn('STAFF')
    const bodies: unknown[] = []
    let calls = 0
    mockApi({
      'POST /api/core/checkin': async (request) => {
        bodies.push(await request.json())
        calls += 1
        return calls === 1
          ? json({ result: 'OK', message: 'Hợp lệ, mời vào', ticket: { ticketType: 'VIP', seat: 'A-5' }, checkedInAt: '2026-10-19T07:00:00Z', checkedInGate: 'B2' })
          : json({ result: 'ALREADY_USED', message: 'Vé đã được sử dụng lúc 14:00 tại cổng B2', ticket: { ticketType: 'VIP', seat: 'A-5' }, checkedInAt: '2026-10-19T07:00:00Z', checkedInGate: 'B2' })
      },
    })
    renderApp('/checkin?gate=B2')

    const code = await screen.findByLabelText('Nhập mã bằng tay')
    await userEvent.type(code, 'TR1.k1.abc')
    await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra mã' }))
    expect(await screen.findByText('Mời vào')).toBeInTheDocument()
    expect(screen.getByText('A-5')).toBeInTheDocument()

    await userEvent.type(code, 'TR1.k1.abc')
    await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra mã' }))
    expect(await screen.findByText('Vé đã được dùng')).toBeInTheDocument()
    expect(screen.getByText('Lượt quét trước')).toBeInTheDocument()
    expect(bodies).toEqual([
      { qrToken: 'TR1.k1.abc', gate: 'B2' },
      { qrToken: 'TR1.k1.abc', gate: 'B2' },
    ])
  })

  it('says so when the staff member is not assigned to the event', async () => {
    signIn('STAFF')
    mockApi({ 'POST /api/core/checkin': () => json({ status: 403, code: 'FORBIDDEN', detail: 'x' }, 403) })
    renderApp('/checkin?gate=A1')

    await userEvent.type(await screen.findByLabelText('Nhập mã bằng tay'), 'TR1.k1.x')
    await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra mã' }))
    expect(await screen.findByText(/không được phân công/)).toBeInTheDocument()
  })

  it('is only for staff accounts', async () => {
    signIn('CUSTOMER')
    mockApi({})
    renderApp('/checkin')
    expect(await screen.findByText('Bạn không có quyền xem trang này')).toBeInTheDocument()
  })
})
