/**
 * A task board: Kanban columns that share the width, cards with tags picked (or created) in a
 * Combobox, and a due date with time from DateTimePicker. Kanban's value is a record of column id
 * to items; items need an `id` (or pass getItemId).
 */
import { useState } from 'react'
import {
  Badge,
  Combobox,
  DateTimePicker,
  FormField,
  Kanban,
  type ComboboxOption,
  type DateTimeValue,
  type KanbanColumn,
  type KanbanValue,
} from 'momi-ui'

interface Card {
  id: string
  title: string
  tags: string[]
}

const columns: KanbanColumn[] = [
  { id: 'todo', title: 'To do', tone: 'info' },
  { id: 'doing', title: 'In progress', tone: 'warning', limit: 3 },
  { id: 'done', title: 'Done', tone: 'success' },
]

export function Board({ initial }: { initial: KanbanValue<Card> }) {
  const [board, setBoard] = useState(initial)
  return (
    <Kanban<Card>
      aria-label="Tasks"
      columns={columns}
      value={board}
      onValueChange={setBoard}
      // Save one move at a time: ({ item, from, to }) => api.move(item.id, to.columnId, to.index)
      onCardMove={() => {}}
      getItemLabel={(card) => card.title} // read out while dragging with the keyboard
      columnWidth="fill"
      minColumnWidth={220}
      renderCard={(card) => (
        <div className="grid gap-2">
          <span className="font-medium">{card.title}</span>
          <div className="flex flex-wrap gap-1">
            {card.tags.map((tag) => (
              <Badge key={tag} size="xs" variant="soft">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    />
  )
}

export function CardFields() {
  const [tags, setTags] = useState<ComboboxOption[]>([
    { value: 'bug', label: 'Bug' },
    { value: 'design', label: 'Design' },
  ])
  const [selected, setSelected] = useState<string[]>([])
  const [due, setDue] = useState<DateTimeValue>({ date: null, time: null })

  return (
    <div className="grid gap-4">
      <FormField label="Tags">
        <Combobox
          multiple
          options={tags}
          value={selected}
          onValueChange={setSelected}
          // Offered when the typed text matches no option; the returned option is selected.
          onCreate={(label) => {
            const option = { value: label.toLowerCase(), label }
            setTags((list) => [...list, option])
            return option
          }}
        />
      </FormField>
      <FormField label="Due">
        <DateTimePicker
          value={due}
          onValueChange={setDue}
          allowAllDay
          timeSuggestions={['09:00', '13:00', '17:00']}
          presets={[
            { label: 'Today', date: new Date() },
            { label: 'No date', date: null },
          ]}
        />
      </FormField>
    </div>
  )
}
