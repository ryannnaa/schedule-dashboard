import { useEffect, useCallback } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import styles from './DayModal.module.css'

export default function DayModal({ date, dayData, onClose }) {
  const { viewMode, staffColourMap, selectedStaff } = useSchedule()
  const selectedSet = new Set(selectedStaff.map(s => s.toUpperCase()))

  // Close on Escape
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  const dateLabel = date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const hasConflicts = dayData.conflicts?.size > 0

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={dateLabel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.dateTitle}>{dateLabel}</h2>
            <p className={styles.dateSub}>
              {dayData.events.length} event{dayData.events.length !== 1 ? 's' : ''}
              {hasConflicts && (
                <span className={styles.conflictBadge}>⚠ scheduling conflict</span>
              )}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Event list */}
        <div className={styles.eventList}>
          {dayData.events.map((event, i) => {
            const eventHasConflict = event.conflicts?.size > 0
            return (
              <div
                key={i}
                className={`${styles.eventCard} ${eventHasConflict ? styles.eventConflict : ''}`}
              >
                <div className={styles.eventHeader}>
                  <span className={styles.eventName}>{event.name || '—'}</span>
                  {event.classroom && (
                    <span className={styles.classroomTag}>{event.classroom}</span>
                  )}
                </div>

                {eventHasConflict && (
                  <p className={styles.conflictNote}>
                    ⚠ {[...event.conflicts].join(', ')} {event.conflicts.size === 1 ? 'is' : 'are'} assigned to the same slot more than once
                  </p>
                )}

                <div className={styles.shiftRow}>
                  {event.shifts.length === 0 ? (
                    <span className={styles.noShifts}>No shifts assigned</span>
                  ) : (
                    event.shifts.map((initial, si) => {
                      if (!initial) return null
                      const key = initial.toUpperCase()
                      const isConflict = event.conflicts?.has(key)
                      const colour = staffColourMap[initial] ??
                        staffColourMap[Object.keys(staffColourMap).find(k => k.toUpperCase() === key)]
                      const isSelected = selectedSet.has(key)
                      const dimmed = viewMode !== 'full' && !isSelected

                      return (
                        <div key={si} className={styles.shiftSlot}>
                          <span className={styles.slotLabel}>Slot {si + 1}</span>
                          <span
                            className={`
                              ${styles.shiftBadge}
                              ${dimmed ? styles.dimmed : ''}
                              ${isConflict ? styles.badgeConflict : ''}
                            `}
                            style={colour && isSelected ? {
                              backgroundColor: colour.bg,
                              color: colour.text,
                              borderColor: colour.border,
                            } : {}}
                          >
                            {isConflict && '! '}
                            {initial}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
