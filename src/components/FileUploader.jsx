import { useRef, useState } from 'react'
import { readExcelFile } from '../utils/excel'
import styles from './FileUploader.module.css'

export default function FileUploader({ onFileLoaded }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)

  async function processFile(file) {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const result = await readExcelFile(file)
      onFileLoaded({ file, ...result })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        role="button"
        tabIndex={0}
        aria-label="Upload Excel file"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className={styles.hiddenInput}
          onChange={(e) => processFile(e.target.files[0])}
        />

        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} aria-hidden="true" />
            <p>Reading file…</p>
          </div>
        ) : (
          <div className={styles.idleState}>
            <div className={styles.iconWrap} aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className={styles.primaryText}>Drop your Excel file here</p>
            <p className={styles.secondaryText}>or click to browse — .xlsx and .xls supported</p>
          </div>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
