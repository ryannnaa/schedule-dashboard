import { useState } from 'react'
import { useSchedule } from './context/ScheduleContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import StepIndicator from './components/StepIndicator'
import FileUploader from './components/FileUploader'
import ColumnMapper from './components/ColumnMapper'
import SchedulePreview from './components/SchedulePreview'
import StaffSelector from './components/StaffSelector'
import CalendarView from './components/CalendarView'
import styles from './App.module.css'

const PHASE = { UPLOAD: 1, MAP: 2, PREVIEW: 3, STAFF: 4, CALENDAR: 5 }

// Steps shown in the indicator — calendar added for Phase 3
const STEPS = ['Upload', 'Map columns', 'Preview', 'Select staff']

export default function App() {
  const {
    fileInfo, loadFile,
    mapping, rawMapping, updateMapping,
    parsedDays, staffList, warnings,
    selectedStaff,
    viewMode,
    reset,
  } = useSchedule()

  const [phase, setPhase] = useState(PHASE.UPLOAD)
  const [savedMapping, setSavedMapping, clearSavedMapping] = useLocalStorage('col-mapping', null)

  function handleFileLoaded(info) {
    loadFile(info)
    setPhase(PHASE.MAP)
  }

  function handleMappingChange(clean, raw) {
    updateMapping(clean, raw)
  }

  function handleSaveAndPreview() {
    setSavedMapping(rawMapping)
    setPhase(PHASE.PREVIEW)
  }

  function handleReset() {
    reset()
    setPhase(PHASE.UPLOAD)
  }

  const isMappingReady = mapping &&
    mapping.dayCol !== '' &&
    mapping.dateCol !== '' &&
    mapping.groups?.length > 0 &&
    mapping.groups.some(g => g.event !== undefined && g.event !== '')

  // Indicator step: STAFF phase maps to step 4
  const indicatorStep = Math.min(phase, STEPS.length)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.title}>Schedule Dashboard</h1>
            <p className={styles.subtitle}>Your personal shift calendar</p>
          </div>
          {fileInfo && (
            <div className={styles.fileBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{fileInfo.file.name}</span>
              <button onClick={handleReset} aria-label="Remove file and start over">×</button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <StepIndicator current={indicatorStep} steps={STEPS} />

        {/* Step 1 — Upload */}
        {phase === PHASE.UPLOAD && (
          <section aria-labelledby="upload-heading">
            <h2 id="upload-heading" className={styles.stepHeading}>Upload your schedule</h2>
            <p className={styles.stepDesc}>
              Drag and drop your Excel scheduling file below. The app will read the first sheet automatically.
            </p>
            <FileUploader onFileLoaded={handleFileLoaded} />
            {savedMapping && (
              <p className={styles.savedNote}>
                A previous column mapping was found and will be pre-loaded in step 2.
                <button className={styles.linkBtn} onClick={clearSavedMapping}>Clear it</button>
              </p>
            )}
          </section>
        )}

        {/* Step 2 — Map columns */}
        {phase === PHASE.MAP && fileInfo && (
          <section aria-labelledby="map-heading">
            <h2 id="map-heading" className={styles.stepHeading}>Map your columns</h2>
            <p className={styles.stepDesc}>
              Tell the app which columns in <strong>{fileInfo.sheetName}</strong> hold each piece of information.
            </p>
            <ColumnMapper
              headers={fileInfo.data[0] ?? []}
              savedMapping={savedMapping}
              onMappingChange={handleMappingChange}
            />
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={() => setPhase(PHASE.UPLOAD)}>
                ← Back
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSaveAndPreview}
                disabled={!isMappingReady}
              >
                Preview →
              </button>
            </div>
          </section>
        )}

        {/* Step 3 — Preview */}
        {phase === PHASE.PREVIEW && (
          <section aria-labelledby="preview-heading">
            <h2 id="preview-heading" className={styles.stepHeading}>Check your data</h2>
            <p className={styles.stepDesc}>
              {parsedDays.length} days parsed · {staffList.length} staff detected.
              {warnings.length > 0 && (
                <span className={styles.warningInline}> · {warnings.length} row{warnings.length !== 1 ? 's' : ''} with date issues</span>
              )}
            </p>

            {warnings.length > 0 && (
              <div className={styles.warningBox} role="alert">
                <strong>Date warnings</strong>
                <ul className={styles.warningList}>
                  {warnings.map((w, i) => (
                    <li key={i}>
                      Row with day "{w.day}" has an unreadable date ("{w.rawDate}") — {w.eventCount} event{w.eventCount !== 1 ? 's' : ''} may be excluded from the calendar.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <SchedulePreview parsedDays={parsedDays} staffList={staffList} />
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={() => setPhase(PHASE.MAP)}>
                ← Back
              </button>
              <button
                className={styles.btnPrimary}
                disabled={parsedDays.length === 0}
                onClick={() => setPhase(PHASE.STAFF)}
              >
                Select staff →
              </button>
            </div>
          </section>
        )}

        {/* Step 4 — Select staff */}
        {phase === PHASE.STAFF && (
          <section aria-labelledby="staff-heading">
            <h2 id="staff-heading" className={styles.stepHeading}>Select staff member</h2>
            <p className={styles.stepDesc}>
              Choose whose shifts to display on the calendar.
              You can switch between staff members at any time.
            </p>
            <StaffSelector onConfirm={() => setPhase(PHASE.CALENDAR)} />
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={() => setPhase(PHASE.PREVIEW)}>
                ← Back
              </button>
            </div>
          </section>
        )}

        {/* Step 5 — Calendar */}
        {phase === PHASE.CALENDAR && (
          <section aria-labelledby="calendar-heading">
            <h2 id="calendar-heading" className={styles.stepHeading}>
              {viewMode === 'personal' ? `${selectedStaff[0]}'s calendar` : viewMode === 'comparison' ? `${selectedStaff.join(' & ')} comparison` : 'Full calendar'}
            </h2>
            <p className={styles.stepDesc}>
              Click any day to see full event details.
            </p>
            <CalendarView />
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={() => setPhase(PHASE.STAFF)}>
                ← Change staff
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
