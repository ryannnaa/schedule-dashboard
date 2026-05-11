import { useState } from 'react'
import { colIndexToLetter } from '../utils/excel'
import styles from './ColumnMapper.module.css'

const EMPTY = ''

function ColSelect({ id, value, onChange, headers, placeholder = '— select —' }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value === EMPTY ? EMPTY : Number(e.target.value))}
    >
      <option value={EMPTY}>{placeholder}</option>
      {headers.map((header, idx) => (
        <option key={idx} value={idx}>
          {colIndexToLetter(idx)}{header ? ` — ${header}` : ''}
        </option>
      ))}
    </select>
  )
}

let nextGroupId = 1
function makeGroup() {
  return { id: nextGroupId++, event: EMPTY, classroom: EMPTY, shifts: [EMPTY, EMPTY, EMPTY] }
}

export default function ColumnMapper({ headers, savedMapping, onMappingChange }) {
  const initial = savedMapping ?? {
    dayCol: EMPTY,
    dateCol: EMPTY,
    groups: [makeGroup()],
    repeatCount: 1,
    repeatStride: 5,
    dateFrom: '',
    dateTo: '',
  }

  const [dayCol,       setDayColState]       = useState(initial.dayCol)
  const [dateCol,      setDateColState]      = useState(initial.dateCol)
  const [groups,       setGroupsState]       = useState(initial.groups?.length ? initial.groups : [makeGroup()])
  const [repeatCount,  setRepeatCountState]  = useState(initial.repeatCount  ?? 1)
  const [repeatStride, setRepeatStrideState] = useState(initial.repeatStride ?? 5)
  const [dateFrom,     setDateFromState]     = useState(initial.dateFrom ?? '')
  const [dateTo,       setDateToState]       = useState(initial.dateTo   ?? '')

  function emit(overrides = {}) {
    const state = {
      dayCol, dateCol, groups, repeatCount, repeatStride, dateFrom, dateTo,
      ...overrides,
    }
    const cleanGroups = state.groups.map((g) => ({
      ...g,
      shifts: g.shifts.filter((s) => s !== EMPTY),
    }))
    onMappingChange(
      { ...state, groups: cleanGroups },
      { ...state }
    )
  }

  function setDayCol(v)       { setDayColState(v);       emit({ dayCol: v }) }
  function setDateCol(v)      { setDateColState(v);      emit({ dateCol: v }) }
  function setRepeatCount(v)  { setRepeatCountState(v);  emit({ repeatCount: v }) }
  function setRepeatStride(v) { setRepeatStrideState(v); emit({ repeatStride: v }) }
  function setDateFrom(v)     { setDateFromState(v);     emit({ dateFrom: v }) }
  function setDateTo(v)       { setDateToState(v);       emit({ dateTo: v }) }

  function updateGroup(id, field, value) {
    const next = groups.map((g) => g.id === id ? { ...g, [field]: value } : g)
    setGroupsState(next)
    emit({ groups: next })
  }

  function updateShift(id, index, value) {
    const next = groups.map((g) => {
      if (g.id !== id) return g
      const shifts = [...g.shifts]
      shifts[index] = value
      return { ...g, shifts }
    })
    setGroupsState(next)
    emit({ groups: next })
  }

  function addGroup() {
    const next = [...groups, makeGroup()]
    setGroupsState(next)
    emit({ groups: next })
  }

  function removeGroup(id) {
    const next = groups.filter((g) => g.id !== id)
    setGroupsState(next)
    emit({ groups: next })
  }

  // Preview the auto-generated column offsets so the user can verify
  const previewCols = groups[0]
    ? Array.from({ length: Math.min(repeatCount, 9) }, (_, i) => {
        const base = groups[0]
        const offset = i * repeatStride
        const eventCol  = base.event     !== '' ? Number(base.event)     + offset : null
        const shiftCols = base.shifts.filter(s => s !== EMPTY).map(s => Number(s) + offset)
        return { index: i + 1, eventCol, shiftCols }
      })
    : []

  return (
    <div className={styles.wrapper}>

      {/* Base columns */}
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Base columns</h3>
        <p className={styles.sectionDesc}>These apply to every row in the sheet.</p>
        <div className={styles.fieldGrid}>
          <label htmlFor="col-day" className={styles.label}>
            Day of week
            <span className={styles.hint}>e.g. Mon, Tue…</span>
          </label>
          <ColSelect id="col-day" value={dayCol} onChange={setDayCol} headers={headers} />

          <label htmlFor="col-date" className={styles.label}>
            Date
            <span className={styles.hint}>e.g. 11 May 2026</span>
          </label>
          <ColSelect id="col-date" value={dateCol} onChange={setDateCol} headers={headers} />
        </div>
      </section>

      {/* First event group */}
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Event group structure</h3>
        <p className={styles.sectionDesc}>
          Map the <strong>first</strong> event block only. Use the repeat settings below to
          auto-generate the remaining blocks.
        </p>

        <div className={styles.groupList}>
          {groups.map((group, index) => (
            <div key={group.id} className={styles.groupBlock}>
              <div className={styles.groupHeader}>
                <span className={styles.groupLabel}>
                  {index === 0 ? 'First event block (template)' : `Extra block ${index + 1}`}
                </span>
                {groups.length > 1 && index > 0 && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeGroup(group.id)}
                    aria-label={`Remove block ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className={styles.fieldGrid}>
                <label className={styles.label}>Event name</label>
                <ColSelect
                  value={group.event}
                  onChange={(v) => updateGroup(group.id, 'event', v)}
                  headers={headers}
                />
                <label className={styles.label}>Classroom</label>
                <ColSelect
                  value={group.classroom}
                  onChange={(v) => updateGroup(group.id, 'classroom', v)}
                  headers={headers}
                />
              </div>

              <div className={styles.shiftRow}>
                <span className={styles.label}>Shift slots</span>
                <div className={styles.shiftSelects}>
                  {[0, 1, 2].map((i) => (
                    <ColSelect
                      key={i}
                      value={group.shifts[i] ?? EMPTY}
                      onChange={(v) => updateShift(group.id, i, v)}
                      headers={headers}
                      placeholder={`Slot ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className={styles.addBtn} onClick={addGroup}>
          + Add a non-repeating block with different columns
        </button>
      </section>

      {/* Repeat settings */}
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Repeat pattern</h3>
        <p className={styles.sectionDesc}>
          Tell the app how many times the first block repeats across the row, and how many
          columns wide each block is. For your sheet (Event, Classroom, Shift×3) the stride is <strong>5</strong>.
        </p>

        <div className={styles.fieldGrid}>
          <label htmlFor="repeat-count" className={styles.label}>
            Number of event blocks
            <span className={styles.hint}>including the first one (max 9)</span>
          </label>
          <input
            id="repeat-count"
            type="number"
            min={1}
            max={9}
            value={repeatCount}
            onChange={(e) => setRepeatCount(Math.min(9, Math.max(1, Number(e.target.value))))}
            className={styles.numberInput}
          />

          <label htmlFor="repeat-stride" className={styles.label}>
            Columns per block (stride)
            <span className={styles.hint}>how wide each repeated block is</span>
          </label>
          <input
            id="repeat-stride"
            type="number"
            min={1}
            max={26}
            value={repeatStride}
            onChange={(e) => setRepeatStride(Math.min(26, Math.max(1, Number(e.target.value))))}
            className={styles.numberInput}
          />
        </div>

        {/* Live preview of generated columns */}
        {repeatCount > 1 && groups[0]?.event !== EMPTY && (
          <div className={styles.repeatPreview}>
            <p className={styles.previewLabel}>Generated event blocks</p>
            <div className={styles.previewGrid}>
              {previewCols.map((p) => (
                <div key={p.index} className={styles.previewChip}>
                  <span className={styles.previewNum}>Block {p.index}</span>
                  {p.eventCol !== null && (
                    <span className={styles.previewCol}>{colIndexToLetter(p.eventCol)}</span>
                  )}
                  {p.shiftCols.map((c, i) => (
                    <span key={i} className={`${styles.previewCol} ${styles.previewShift}`}>
                      {colIndexToLetter(c)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Date range */}
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Date range <span className={styles.optionalBadge}>optional</span></h3>
        <p className={styles.sectionDesc}>
          Leave blank to parse the full sheet. Set a range to limit the schedule to a specific period.
        </p>
        <div className={styles.fieldGrid}>
          <label htmlFor="date-from" className={styles.label}>
            From
            <span className={styles.hint}>first day to include</span>
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={styles.dateInput}
          />

          <label htmlFor="date-to" className={styles.label}>
            To
            <span className={styles.hint}>last day to include</span>
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={styles.dateInput}
          />
        </div>
      </section>

    </div>
  )
}
