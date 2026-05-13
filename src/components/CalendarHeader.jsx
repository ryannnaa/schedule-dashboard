import { useLocalStorage } from '../hooks/useLocalStorage'
import styles from './CalendarHeader.module.css'

export const WEEK_START_KEY = 'calendar-week-start'

export function useWeekStart() {
  return useLocalStorage(WEEK_START_KEY, 'monday')
}

export default function CalendarHeader({ year, month, onPrev, onNext, weekStart, onWeekStartChange }) {
  const monthLabel = new Date(year, month).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={styles.header}>
      <div className={styles.navGroup}>
        <button className={styles.navBtn} onClick={onPrev} aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className={styles.monthLabel}>{monthLabel}</h2>
        <button className={styles.navBtn} onClick={onNext} aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.weekToggle} role="group" aria-label="Week start day">
          <button
            className={`${styles.toggleBtn} ${weekStart === 'monday' ? styles.toggleActive : ''}`}
            onClick={() => onWeekStartChange('monday')}
          >
            Mon
          </button>
          <button
            className={`${styles.toggleBtn} ${weekStart === 'sunday' ? styles.toggleActive : ''}`}
            onClick={() => onWeekStartChange('sunday')}
          >
            Sun
          </button>
        </div>
      </div>
    </div>
  )
}
