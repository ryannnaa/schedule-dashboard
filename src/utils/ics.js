/**
 * Generates a .ics calendar file string for a single staff member's shifts.
 *
 * Each shift slot the person is assigned to becomes a separate timed calendar event:
 *   - Title:    event name
 *   - Location: classroom
 *   - Start/End: exact times for that slot (SGT, UTC+8)
 *   - UID:      stable unique ID so re-imports don't create duplicates
 *
 * All generation is client-side — no data leaves the browser.
 */

// Fixed shift times per slot index (0-based), in SGT (UTC+8)
const SHIFT_TIMES = {
  0: { label: 'Shift 1', start: '08:00', end: '09:30' },
  1: { label: 'Shift 2', start: '12:30', end: '14:00' },
  2: { label: 'Shift 3', start: '16:30', end: '18:00' },
}

export function generateIcs(filteredDays, staffInitial) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Schedule Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${staffInitial} Shifts`,
    'X-WR-TIMEZONE:Asia/Singapore',
    // Embed the SGT timezone definition so Outlook/Google honour the times correctly
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Singapore',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800',
    'TZNAME:SGT',
    'END:STANDARD',
    'END:VTIMEZONE',
  ]

  filteredDays.forEach((day) => {
    if (!day.date) return

    const dateStr = toIcsDate(day.date)

    day.events.forEach((event, eventIndex) => {
      // A person may appear in multiple shift slots within the same event block
      event.shifts.forEach((initial, slotIndex) => {
        if (!initial) return
        if (initial.toUpperCase() !== staffInitial.toUpperCase()) return

        const shift = SHIFT_TIMES[slotIndex]
        if (!shift) return

        const uid = `${dateStr}-${staffInitial}-${eventIndex}-${slotIndex}@schedule-dashboard`

        lines.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${toIcsTimestamp(new Date())}`,
          `DTSTART;TZID=Asia/Singapore:${dateStr}T${shift.start.replace(':', '')}00`,
          `DTEND;TZID=Asia/Singapore:${dateStr}T${shift.end.replace(':', '')}00`,
          `SUMMARY:${escapeIcs(event.name || 'Shift')}`,
          `LOCATION:${escapeIcs(event.classroom || '')}`,
          `DESCRIPTION:${escapeIcs(shift.label)}`,
          'TRANSP:OPAQUE',
          'END:VEVENT',
        )
      })
    })
  })

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Triggers a browser download of the generated .ics string.
 */
export function downloadIcs(icsString, filename) {
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Helpers ---

function toIcsDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function toIcsTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}
