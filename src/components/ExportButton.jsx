import { useState } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import { generateIcs, downloadIcs } from '../utils/ics'
import styles from './ExportButton.module.css'

export default function ExportButton() {
  const { filteredDays, selectedStaff, viewMode } = useSchedule()
  const [exported, setExported] = useState(false)

  const isDisabled = viewMode === 'full' || selectedStaff.length === 0

  // In comparison mode export each selected person's shifts separately
  function handleExport() {
    if (isDisabled) return

    selectedStaff.forEach((initial) => {
      // For each person filter down to only days where they have a shift
      const personalDays = filteredDays
        .map((day) => ({
          ...day,
          events: day.events.filter((e) =>
            e.shifts.some((s) => s.toUpperCase() === initial.toUpperCase())
          ),
        }))
        .filter((day) => day.events.length > 0)

      const shiftCount = personalDays.reduce((acc, d) => acc + d.events.length, 0)
      if (shiftCount === 0) return

      const ics      = generateIcs(personalDays, initial)
      const filename = `${initial}-shifts.ics`
      downloadIcs(ics, filename)
    })

    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  const shiftCount = isDisabled ? 0 : filteredDays.reduce(
    (acc, d) => acc + d.events.filter((e) =>
      e.shifts.some((s) =>
        selectedStaff.some((p) => p.toUpperCase() === s.toUpperCase())
      )
    ).length, 0
  )

  const buttonLabel = () => {
    if (exported) return '✓ Downloaded'
    if (isDisabled) return 'Export to calendar'
    if (viewMode === 'comparison') return `Export ${selectedStaff.join(' & ')} (${selectedStaff.length} files)`
    return `Export ${selectedStaff[0]}'s shifts (${shiftCount} event${shiftCount !== 1 ? 's' : ''})`
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.btn} ${exported ? styles.btnSuccess : ''}`}
        onClick={handleExport}
        disabled={isDisabled}
        title={isDisabled ? 'Select a staff member to export their shifts' : ''}
      >
        {!exported && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        {buttonLabel()}
      </button>
      {isDisabled && (
        <p className={styles.hint}>Select a staff member in the previous step to enable export.</p>
      )}
      {exported && (
        <p className={styles.hint}>
          Import the .ics file into Google Calendar, Apple Calendar, or Outlook.
        </p>
      )}
    </div>
  )
}
