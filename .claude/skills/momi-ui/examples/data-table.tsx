/**
 * DataTable with typed columns: sorting, a pinned column, a footer total, row actions in a
 * DropdownMenu, and a search box above it. Rows need a stable `id` (or pass getRowId).
 */
import { useMemo, useState } from 'react'
import {
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  type DataTableColumnDef,
} from 'momi-ui'

interface Invoice {
  id: string
  customer: string
  issued: Date
  amount: number
}

export function Invoices({ rows, onDelete }: { rows: Invoice[]; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })

  const columns: DataTableColumnDef<Invoice>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: 'customer',
      sortable: true,
      pin: 'left',
      width: 220,
    },
    {
      id: 'issued',
      header: 'Issued',
      accessor: 'issued',
      sortable: true,
      cell: ({ row }) => row.issued.toLocaleDateString(),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      align: 'end',
      sortable: true,
      cell: ({ row }) => money.format(row.amount),
      footer: (all) => money.format(all.reduce((sum, r) => sum + r.amount, 0)),
    },
    {
      id: 'actions',
      width: 56,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton size="sm" aria-label={`Actions for ${row.customer}`}>
              ⋯
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Download PDF</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger" onSelect={() => onDelete(row.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const visible = useMemo(
    () => rows.filter((r) => r.customer.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  )

  return (
    <div className="grid gap-3">
      <Input
        type="search"
        aria-label="Search customers"
        placeholder="Search customers"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <DataTable data={visible} columns={columns} maxHeight={480} resizableColumns />
    </div>
  )
}
