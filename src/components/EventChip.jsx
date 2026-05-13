import { useSchedule } from '../context/ScheduleContext'
import styles from './EventChip.module.css'

/**
 * Compact event row for inside a calendar cell.
 * Shows classroom (short code) instead of event name for better space allocation.
 * Full event name + details are available in the DayModal on click.
 */
export default function EventChip({ event }) {
  const { viewMode, staffColourMap, selectedStaff } = useSchedule()
  const selectedSet = new Set(selectedStaff.map(s => s.toUpperCase()))

  return (
    <div className={styles.chip}>
      <span className={styles.eventName}>{event.classroom || event.name || '—'}</span>
      <div className={styles.shifts}>
        {event.shifts.map((initial, i) => {
          if (!initial) return null
          const key = initial.toUpperCase()
          const isConflict = event.conflicts?.has(key)
          const colour = staffColourMap[initial] ?? staffColourMap[
            // case-insensitive lookup
            Object.keys(staffColourMap).find(k => k.toUpperCase() === key)
          ]
          const isSelected = selectedSet.has(key)

          const dimmed = viewMode !== 'full' && !isSelected

          return (
            <span
              key={i}
              className={`${styles.shiftBadge} ${dimmed ? styles.dimmed : ''} ${isConflict ? styles.conflict : ''}`}
              style={colour && isSelected ? {
                backgroundColor: colour.bg,
                color: colour.text,
                borderColor: colour.border,
              } : {}}
              title={isConflict ? `${initial} is double-booked in this slot` : initial}
            >
              {isConflict && <span className={styles.conflictDot} aria-hidden="true">!</span>}
              {initial}
            </span>
          )
        })}
      </div>
    </div>
  )
}
