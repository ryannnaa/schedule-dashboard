import { useSchedule, STAFF_COLOURS } from '../context/ScheduleContext'
import styles from './StaffSelector.module.css'

export default function StaffSelector({ onConfirm }) {
  const {
    staffList,
    selectedStaff,
    toggleStaff,
    clearSelection,
    viewMode,
    staffColourMap,
    filteredDays,
    parsedDays,
  } = useSchedule()

  const selectionCount = selectedStaff.length
  const atLimit = selectionCount >= 3

  // Per-staff shift count (across all days)
  function shiftCount(initial) {
    return parsedDays.reduce((acc, day) =>
      acc + day.events.filter(e =>
        e.shifts.some(s => s.toUpperCase() === initial.toUpperCase())
      ).length, 0)
  }

  // Summary stats for selected staff combined
  const totalDays   = filteredDays.length
  const totalEvents = filteredDays.reduce((acc, d) => acc + d.events.length, 0)
  const totalConflicts = filteredDays.reduce((acc, d) =>
    acc + (d.conflicts?.size > 0 ? 1 : 0), 0)

  // Label for the confirm button
  function confirmLabel() {
    if (viewMode === 'full')       return 'View full calendar →'
    if (viewMode === 'personal')   return `View ${selectedStaff[0]}'s calendar →`
    return `Compare ${selectedStaff.join(' & ')} →`
  }

  return (
    <div className={styles.wrapper}>

      {/* Mode hint */}
      <div className={styles.modeRow}>
        <span className={`${styles.modeBadge} ${viewMode === 'full' ? styles.modeBadgeActive : ''}`}>
          Full view
        </span>
        <span className={styles.modeArrow}>→</span>
        <span className={`${styles.modeBadge} ${viewMode === 'personal' ? styles.modeBadgeActive : ''}`}>
          Personal
        </span>
        <span className={styles.modeArrow}>→</span>
        <span className={`${styles.modeBadge} ${viewMode === 'comparison' ? styles.modeBadgeActive : ''}`}>
          Comparison
        </span>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Select staff</h3>
            <p className={styles.sectionDesc}>
              Choose up to 3 people, or skip selection to view the full schedule.
              {atLimit && <span className={styles.limitNote}> Maximum of 3 reached.</span>}
            </p>
          </div>
          {selectionCount > 0 && (
            <button className={styles.clearBtn} onClick={clearSelection}>
              Clear
            </button>
          )}
        </div>

        <div className={styles.pillGrid}>
          {staffList.map((initial) => {
            const isSelected  = selectedStaff.includes(initial)
            const colourIndex = selectedStaff.indexOf(initial)
            const colour      = isSelected ? STAFF_COLOURS[colourIndex] : null
            const disabled    = atLimit && !isSelected
            const count       = shiftCount(initial)

            return (
              <button
                key={initial}
                className={`${styles.pill} ${isSelected ? styles.pillSelected : ''} ${disabled ? styles.pillDisabled : ''}`}
                style={colour ? {
                  backgroundColor: colour.bg,
                  borderColor:     colour.border,
                  color:           colour.text,
                } : {}}
                onClick={() => !disabled && toggleStaff(initial)}
                aria-pressed={isSelected}
                disabled={disabled}
              >
                {isSelected && (
                  <span className={styles.pillColourDot} style={{ background: colour.border }} />
                )}
                <span className={styles.pillInitials}>{initial}</span>
                <span className={styles.pillCount}>{count} shift{count !== 1 ? 's' : ''}</span>
              </button>
            )
          })}
        </div>

        {/* Colour legend when multiple selected */}
        {selectionCount > 1 && (
          <div className={styles.legend}>
            {selectedStaff.map((initial, i) => (
              <span key={initial} className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: STAFF_COLOURS[i].border }}
                />
                {initial}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Summary card — always shown */}
      <section className={styles.summaryCard}>
        {viewMode !== 'full' ? (
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{totalDays}</span>
              <span className={styles.summaryLabel}>days with shifts</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{totalEvents}</span>
              <span className={styles.summaryLabel}>total events</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={`${styles.summaryValue} ${totalConflicts > 0 ? styles.conflictValue : ''}`}>
                {totalConflicts}
              </span>
              <span className={styles.summaryLabel}>
                {totalConflicts > 0 ? '⚠ days with conflicts' : 'days with conflicts'}
              </span>
            </div>
          </div>
        ) : (
          <p className={styles.fullViewNote}>
            Showing all {parsedDays.length} days · {staffList.length} staff members
          </p>
        )}

        <button className={styles.confirmBtn} onClick={onConfirm}>
          {confirmLabel()}
        </button>
      </section>
    </div>
  )
}
