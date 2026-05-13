import EventChip from './EventChip'
import styles from './CalendarCell.module.css'

const MAX_VISIBLE = 3

export default function CalendarCell({ date, dayData, isToday, isCurrentMonth, onClick }) {
  const events = dayData?.events ?? []
  const visible = events.slice(0, MAX_VISIBLE)
  const overflow = events.length - MAX_VISIBLE
  const hasConflict = dayData?.conflicts?.size > 0

  return (
    <div
      className={`
        ${styles.cell}
        ${!isCurrentMonth ? styles.outsideMonth : ''}
        ${isToday ? styles.today : ''}
        ${dayData ? styles.hasEvents : ''}
      `}
      onClick={() => dayData && onClick(date, dayData)}
      role={dayData ? 'button' : undefined}
      tabIndex={dayData ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && dayData && onClick(date, dayData)}
      aria-label={dayData ? `${date.toLocaleDateString('en-GB')} — ${events.length} event${events.length !== 1 ? 's' : ''}` : undefined}
    >
      <div className={styles.dateRow}>
        <span className={styles.dateNum}>{date.getDate()}</span>
        {hasConflict && (
          <span className={styles.conflictFlag} title="Scheduling conflict on this day">⚠</span>
        )}
      </div>

      {visible.length > 0 && (
        <div className={styles.eventList}>
          {visible.map((event, i) => (
            <EventChip key={i} event={event} />
          ))}
          {overflow > 0 && (
            <span className={styles.overflow}>+{overflow} more</span>
          )}
        </div>
      )}
    </div>
  )
}
