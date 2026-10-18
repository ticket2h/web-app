/**
 * EventCalendar with app-owned events. The calendar never stores events: it reports changes and
 * the app updates its list. `end` is exclusive (an all-day event on the 5th–7th ends on the 8th
 * at midnight). Extra fields on your event type come back untouched in every callback.
 */
import { useState } from 'react'
import {
  Button,
  EventCalendar,
  type CalendarEvent,
  type EventCalendarChange,
  type EventCalendarRange,
} from 'momi-ui'

interface Task extends CalendarEvent {
  projectId: string
  /** A generated occurrence of a repeating task: shown but not draggable. */
  occurrenceOf?: string
}

export function Schedule({
  initial,
  onOpen,
  onCreate,
}: {
  initial: Task[]
  onOpen: (task: Task) => void
  onCreate: (range: EventCalendarRange) => Task
}) {
  const [tasks, setTasks] = useState(initial)

  const change = ({ event, start, end, allDay }: EventCalendarChange<Task>) =>
    setTasks((list) => list.map((t) => (t.id === event.id ? { ...t, start, end, allDay } : t)))

  return (
    <EventCalendar<Task>
      // Repeating tasks are expanded by the app; `editable: false` keeps occurrences in place.
      events={tasks.map((t) => (t.occurrenceOf ? { ...t, editable: false } : t))}
      defaultView="week"
      onEventChange={change}
      // Refuse moves into the past; the calendar shows them as not allowed while dragging.
      canChange={({ start }) => start >= new Date(new Date().setHours(0, 0, 0, 0))}
      onSelectRange={(range) => setTasks((list) => [...list, onCreate(range)])}
      onEventClick={onOpen}
      // Load what is on screen (also called on mount): ({ start, end, view }) => fetch(...)
      onRangeChange={() => {}}
      dayStartHour={7}
      dayEndHour={21}
      className="h-[640px]" // give it a height; the time grid scrolls inside
      toolbarActions={
        <Button size="sm" onClick={() => setTasks((list) => [...list, onCreate(nextHour())])}>
          New task
        </Button>
      }
    />
  )
}

function nextHour(): EventCalendarRange {
  const start = new Date()
  start.setHours(start.getHours() + 1, 0, 0, 0)
  return { start, end: new Date(start.getTime() + 60 * 60_000), allDay: false }
}
