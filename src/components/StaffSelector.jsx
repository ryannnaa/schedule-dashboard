import { useSchedule } from '../context/ScheduleContext'
import styles from './StaffSelector.module.css'

/**
 * Renders the staff roster as selectable pill buttons.
 * Selecting one sets the global selectedStaff in context,
 * which filters parsedDays down to myDays for the calendar.
 */
export default function StaffSelector({ onConfirm }) {
  const { staffList, selectedStaff, setSelectedStaff, myDays, parsedDays } = useSchedule()

  return (
    <div className={styles.wrapper}>
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Who are you?</h3>
        <p className={styles.sectionDesc}>
          Select your initials to see only your shifts on the calendar.
        </p>

        <div className={styles.pillGrid}>
          {staffList.map((initial) => {
            const isSelected = selectedStaff === initial
            const shiftCount = parsedDays.reduce((acc, day) =>
              acc + day.events.filter(e =>
                e.shifts.some(s => s.toUpperCase() === initial.toUpperCase())
              ).length, 0)

            return (
              <button
                key={initial}
                className={`${styles.pill} ${isSelected ? styles.pillSelected : ''}`}
                onClick={() => setSelectedStaff(isSelected ? null : initial)}
                aria-pressed={isSelected}
              >
                <span className={styles.pillInitials}>{initial}</span>
                <span className={styles.pillCount}>{shiftCount} shift{shiftCount !== 1 ? 's' : ''}</span>
              </button>
            )
          })}
        </div>
      </section>

      {selectedStaff && (
        <section className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{myDays.length}</span>
              <span className={styles.summaryLabel}>days with shifts</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>
                {myDays.reduce((acc, d) => acc + d.events.length, 0)}
              </span>
              <span className={styles.summaryLabel}>total events</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>
                {[...new Set(myDays.flatMap(d => d.events.map(e => e.classroom)).filter(Boolean))].length}
              </span>
              <span className={styles.summaryLabel}>classrooms</span>
            </div>
          </div>

          <button className={styles.confirmBtn} onClick={onConfirm}>
            View {selectedStaff}'s calendar →
          </button>
        </section>
      )}
    </div>
  )
}
