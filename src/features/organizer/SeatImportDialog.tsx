import { FileSpreadsheet } from 'lucide-react'
import {
  Alert,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FileUpload,
  Text,
  toast,
} from 'momi-ui'
import { useState, type ReactNode } from 'react'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { OrganizerTicketType, SeatImportError } from '../../shared/api/types'
import { saveBlob } from '../../shared/download'
import { useImportSeats } from './api'

const MAX_BYTES = 5 * 1024 * 1024

/**
 * Nhập cả sơ đồ ghế từ một file CSV (Excel: Lưu thành "CSV UTF-8"). BE kiểm tra mọi dòng; có lỗi thì không thêm ghế
 * nào và trả danh sách dòng lỗi để sửa một lần rồi tải lại (ADR-020 ở core-service).
 */
export function SeatImportDialog({ eventId, seatedTypes, trigger }: {
  eventId: string
  seatedTypes: OrganizerTicketType[]
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const importSeats = useImportSeats(eventId)
  const problem = importSeats.error instanceof ApiError ? importSeats.error : null
  const lineErrors =
    problem?.code === 'SEAT_IMPORT_INVALID' ? ((problem.problem.errors ?? []) as SeatImportError[]) : []
  const errorCount = Number(problem?.problem.errorCount ?? lineErrors.length)

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setFiles([])
      importSeats.reset()
    }
  }

  const submit = async () => {
    const file = files[0]
    if (!file) return
    importSeats.mutate(await file.text(), {
      onSuccess: (result) => {
        toast.success(`Đã thêm ${result.created.toLocaleString('vi-VN')} ghế`)
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nhập ghế từ file CSV</DialogTitle>
          <DialogDescription>
            Mỗi dòng một ghế, dòng đầu là tiêu đề <code className="font-mono">loai_ve,khu,hang,so_ghe</code>. Tên loại
            vé phải trùng tên loại vé ngồi của sự kiện. Tối đa 100.000 ghế, 5MB.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div>
            <Button variant="link" size="sm" className="px-0" onClick={() => downloadTemplate(seatedTypes)}>
              Tải file mẫu
            </Button>
          </div>
          <FileUpload
            accept=".csv,text/csv"
            maxFiles={1}
            maxSize={MAX_BYTES}
            value={files}
            onValueChange={(next) => {
              setFiles(next)
              importSeats.reset()
            }}
            label="Kéo file CSV vào đây hoặc bấm để chọn"
            description="Lưu từ Excel bằng định dạng CSV UTF-8 để giữ chữ có dấu"
            showPreviews={false}
          />
          {problem && lineErrors.length === 0 && (
            <Alert tone="danger" variant="soft" role="alert">
              {errorMessage(problem)}
            </Alert>
          )}
          {!problem && importSeats.isError && (
            <Alert tone="danger" variant="soft" role="alert">
              {errorMessage(importSeats.error)}
            </Alert>
          )}
          {lineErrors.length > 0 && (
            <div className="flex flex-col gap-2" role="alert">
              <Text size="sm" weight="semibold" tone="danger">
                File có {errorCount.toLocaleString('vi-VN')} dòng lỗi, chưa thêm ghế nào
                {errorCount > lineErrors.length ? ` (hiện ${lineErrors.length} lỗi đầu)` : ''}
              </Text>
              <DataTable
                aria-label="Các dòng lỗi"
                data={lineErrors}
                getRowId={(row, i) => `${row.line}-${i}`}
                columns={[
                  // Số dòng như trình soạn thảo hiện (50001), không phân cách hàng nghìn
                  { id: 'line', header: 'Dòng', accessor: 'line', cell: ({ row }) => String(row.line), width: 90,
                    cellClassName: 'tabular-nums' },
                  { id: 'message', header: 'Lỗi', accessor: 'message', width: 480 },
                ]}
                size="sm"
                maxHeight={240}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" tone="neutral" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            leftIcon={<FileSpreadsheet className="size-4" />}
            onClick={submit}
            disabled={files.length === 0}
            loading={importSeats.isPending}
          >
            Nhập ghế
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** File mẫu: tiêu đề và vài ghế cho mỗi loại vé ngồi của sự kiện, có BOM để Excel đọc đúng chữ có dấu. */
function downloadTemplate(seatedTypes: OrganizerTicketType[]) {
  const names = seatedTypes.length > 0 ? seatedTypes.map((t) => t.name) : ['VIP']
  const lines = ['loai_ve,khu,hang,so_ghe']
  names.forEach((name, i) => {
    for (let seat = 1; seat <= 3; seat++) {
      lines.push(`${csvCell(name)},Khu ${String.fromCharCode(65 + i)},A,${seat}`)
    }
  })
  saveBlob(new Blob([`﻿${lines.join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8' }), 'mau-nhap-ghe.csv')
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}
