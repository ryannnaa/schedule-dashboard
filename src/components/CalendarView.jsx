import { useState, useMemo } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import { useWeekStart } from './CalendarHeader'
import CalendarHeader from './CalendarHeader'
import CalendarCell from './CalendarCell'
import DayModal from './DayModal'
import styles from './CalendarView.module.css'

const DAY_HEADERS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_HEADERS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Builds the grid of Date objects for a given month.
 * Pads with leading/trailing days to fill complete weeks.
 */
function buildMonthGrid(year, month, weekStart) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  // Day-of-week index for the first cell (0 = first column)
  const startDow = weekStart === 'monday'
    ? (firstDay.getDay() + 6) % 7   // Mon=0 … Sun=6
    : firstDay.getDay()              // Sun=0 … Sat=6

  const endDow = weekStart === 'monday'
    ? (lastDay.getDay() + 6) % 7
    : lastDay.getDay()

  const days = []

  // Leading days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  // Trailing days to complete the last week
  const trailing = endDow === 6 ? 0 : 6 - endDow
  for (let i = 1; i <= trailing; i++) {
    days.push(new Date(year, month + 1, i))
  }

  return days
}

export default function CalendarView() {
  const { filteredDays, dateRange, viewMode, selectedStaff } = useSchedule()
  const [weekStart, setWeekStart] = useWeekStart()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDayData, setSelectedDayData] = useState(null)

  // Start calendar on the month of the earliest data, or today
  const initialDate = dateRange.earliest ?? new Date()
  const [viewYear,  setViewYear]  = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())

  const today = new Date()

  // Build a lookup map: 'YYYY-MM-DD' → dayData
  const dayMap = useMemo(() => {
    const map = {}
    filteredDays.forEach(day => {
      if (!day.date) return
      const key = toKey(day.date)
      map[key] = day
    })
    return map
  }, [filteredDays])

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, weekStart),
    [viewYear, viewMonth, weekStart]
  )

  const dayHeaders = weekStart === 'monday' ? DAY_HEADERS_MON : DAY_HEADERS_SUN

  function goToPrev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function goToNext() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleCellClick(date, dayData) {
    setSelectedDate(date)
    setSelectedDayData(dayData)
  }

  function handleModalClose() {
    setSelectedDate(null)
    setSelectedDayData(null)
  }

  // View mode label for the legend bar
  const viewLabel = viewMode === 'full'
    ? 'Full schedule'
    : viewMode === 'personal'
    ? `${selectedStaff[0]}'s shifts`
    : `Comparing ${selectedStaff.join(' & ')}`

  return (
    <div className={styles.wrapper}>
      <CalendarHeader
        year={viewYear}
        month={viewMonth}
        onPrev={goToPrev}
        onNext={goToNext}
        weekStart={weekStart}
        onWeekStartChange={setWeekStart}
      />

      {/* Legend bar */}
      <div className={styles.legendBar}>
        <span className={styles.viewLabel}>{viewLabel}</span>
        <div className={styles.legendItems}>
          {viewMode !== 'full' && selectedStaff.map((initial, i) => {
            const colours = ['#93c5fd', '#86efac', '#fde047']
            return (
              <span key={initial} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: colours[i] }} />
                {initial}
              </span>
            )
          })}
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--color-danger)' }} />
            Conflict
          </span>
        </div>
      </div>

      {/* Day column headers */}
      <div className={styles.dayHeaders}>
        {dayHeaders.map(d => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {grid.map((date, i) => {
          const key = toKey(date)
          const isCurrentMonth = date.getMonth() === viewMonth
          const isToday = toKey(today) === key
          return (
            <CalendarCell
              key={i}
              date={date}
              dayData={dayMap[key] ?? null}
              isToday={isToday}
              isCurrentMonth={isCurrentMonth}
              onClick={handleCellClick}
            />
          )
        })}
      </div>

      {selectedDate && selectedDayData && (
        <DayModal
          date={selectedDate}
          dayData={selectedDayData}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
