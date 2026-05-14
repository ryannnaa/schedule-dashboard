import { useState } from 'react'
import { useMappings } from '../hooks/useMappings'
import styles from './MappingManager.module.css'

/**
 * UI for saving, loading, and deleting named column mappings.
 * Rendered at the top of the ColumnMapper step.
 *
 * Props:
 *   currentMapping  — the current raw mapping state to save
 *   onLoad          — (mapping) => void  called when user loads a saved mapping
 */
export default function MappingManager({ currentMapping, onLoad }) {
  const { savedMappings, isLoading, error, saveMapping, deleteMapping } = useMappings()
  const [saveName,   setSaveName]   = useState('')
  const [isSaving,   setIsSaving]   = useState(false)
  const [saveError,  setSaveError]  = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // id to confirm

  async function handleSave() {
    const name = saveName.trim()
    if (!name) { setSaveError('Please enter a name for this mapping.'); return }
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const { error } = await saveMapping(name, currentMapping)
    setIsSaving(false)
    if (error) {
      setSaveError(error)
    } else {
      setSaveSuccess(true)
      setSaveName('')
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  async function handleDelete(id) {
    await deleteMapping(id)
    setConfirmDelete(null)
  }

  function handleLoad(saved) {
    onLoad(saved.mapping)
  }

  return (
    <div className={styles.wrapper}>
      {/* Load saved mapping */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Saved mappings</h3>

        {isLoading && <p className={styles.hint}>Loading…</p>}
        {error     && <p className={styles.errorText}>{error}</p>}

        {!isLoading && savedMappings.length === 0 && (
          <p className={styles.hint}>No saved mappings yet. Set up your columns below and save them for next time.</p>
        )}

        {savedMappings.length > 0 && (
          <div className={styles.mappingList}>
            {savedMappings.map((saved) => (
              <div key={saved.id} className={styles.mappingRow}>
                <div className={styles.mappingInfo}>
                  <span className={styles.mappingName}>{saved.name}</span>
                  <span className={styles.mappingDate}>
                    {new Date(saved.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
                <div className={styles.mappingActions}>
                  <button
                    className={styles.loadBtn}
                    onClick={() => handleLoad(saved)}
                  >
                    Load
                  </button>
                  {confirmDelete === saved.id ? (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>Delete?</span>
                      <button className={styles.confirmYes} onClick={() => handleDelete(saved.id)}>Yes</button>
                      <button className={styles.confirmNo}  onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setConfirmDelete(saved.id)}
                      aria-label={`Delete ${saved.name}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save current mapping */}
      <div className={styles.saveRow}>
        <input
          type="text"
          className={styles.nameInput}
          placeholder="Name this mapping — e.g. RSAF Schedule"
          value={saveName}
          onChange={(e) => { setSaveName(e.target.value); setSaveError(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          maxLength={60}
        />
        <button
          className={`${styles.saveBtn} ${saveSuccess ? styles.saveBtnSuccess : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : saveSuccess ? '✓ Saved' : 'Save mapping'}
        </button>
      </div>
      {saveError && <p className={styles.errorText}>{saveError}</p>}
    </div>
  )
}
