import { useState, useMemo } from 'react'
import StepIndicator from './components/StepIndicator'
import FileUploader from './components/FileUploader'
import ColumnMapper from './components/ColumnMapper'
import SchedulePreview from './components/SchedulePreview'
import { parseSchedule, extractStaff } from './utils/excel'
import { useLocalStorage } from './hooks/useLocalStorage'
import styles from './App.module.css'

const PHASE = { UPLOAD: 1, MAP: 2, PREVIEW: 3 }

export default function App() {
  const [phase, setPhase] = useState(PHASE.UPLOAD)
  const [fileInfo, setFileInfo] = useState(null)       // { file, data, sheetName }
  const [mapping, setMapping] = useState(null)          // clean mapping for parsing
  const [rawMapping, setRawMapping] = useState(null)    // raw state including empty selects

  const [savedMapping, setSavedMapping, clearSavedMapping] = useLocalStorage('col-mapping', null)

  function handleFileLoaded(info) {
    setFileInfo(info)
    setPhase(PHASE.MAP)
  }

  function handleMappingChange(cleanMapping, raw) {
    setMapping(cleanMapping)
    setRawMapping(raw)
  }

  function handleSaveAndPreview() {
    setSavedMapping(rawMapping)
    setPhase(PHASE.PREVIEW)
  }

  function handleReset() {
    setFileInfo(null)
    setMapping(null)
    setRawMapping(null)
    setPhase(PHASE.UPLOAD)
  }

  const parsedDays = useMemo(() => {
    if (!fileInfo || !mapping) return []
    try {
      return parseSchedule(fileInfo.data, mapping)
    } catch {
      return []
    }
  }, [fileInfo, mapping])

  const staffList = useMemo(() => extractStaff(parsedDays), [parsedDays])

  const isMappingReady = mapping &&
    mapping.dayCol !== '' &&
    mapping.dateCol !== '' &&
    mapping.groups.length > 0 &&
    mapping.groups.some(g => g.event !== undefined)

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
        <StepIndicator current={phase} />

        {phase === PHASE.UPLOAD && (
          <section aria-labelledby="upload-heading">
            <h2 id="upload-heading" className={styles.stepHeading}>Upload your schedule</h2>
            <p className={styles.stepDesc}>
              Drag and drop your Excel scheduling file below. The app will read the first sheet automatically.
            </p>
            <FileUploader onFileLoaded={handleFileLoaded} />
            {savedMapping && (
              <p className={styles.savedNote}>
                A previous column mapping was found and will be pre-loaded when you reach step 2.
                <button className={styles.linkBtn} onClick={clearSavedMapping}>Clear it</button>
              </p>
            )}
          </section>
        )}

        {phase === PHASE.MAP && fileInfo && (
          <section aria-labelledby="map-heading">
            <h2 id="map-heading" className={styles.stepHeading}>Map your columns</h2>
            <p className={styles.stepDesc}>
              Tell the app which columns in <strong>{fileInfo.sheetName}</strong> hold each piece of information.
              Add one event group per repeating block in your sheet.
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

        {phase === PHASE.PREVIEW && (
          <section aria-labelledby="preview-heading">
            <h2 id="preview-heading" className={styles.stepHeading}>Check your data</h2>
            <p className={styles.stepDesc}>
              {parsedDays.length} days parsed · {staffList.length} staff detected.
              If anything looks wrong, go back and adjust the column mapping.
            </p>
            <SchedulePreview parsedDays={parsedDays} staffList={staffList} />
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={() => setPhase(PHASE.MAP)}>
                ← Back
              </button>
              <button
                className={styles.btnPrimary}
                disabled={parsedDays.length === 0}
                onClick={() => alert('Phase 2 coming soon — calendar view!')}
              >
                Build my calendar →
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
