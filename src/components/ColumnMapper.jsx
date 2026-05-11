import { useState } from 'react'
import { colIndexToLetter } from '../utils/excel'
import styles from './ColumnMapper.module.css'

const EMPTY = ''

function ColSelect({ id, value, onChange, headers, placeholder = '— select —' }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value === EMPTY ? EMPTY : Number(e.target.value))}>
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
  const initial = savedMapping ?? { dayCol: EMPTY, dateCol: EMPTY, groups: [makeGroup()] }

  const [dayCol, setDayCol] = useState(initial.dayCol)
  const [dateCol, setDateCol] = useState(initial.dateCol)
  const [groups, setGroups] = useState(
    initial.groups?.length ? initial.groups : [makeGroup()]
  )

  function update(newDayCol, newDateCol, newGroups) {
    const mapping = {
      dayCol: newDayCol,
      dateCol: newDateCol,
      groups: newGroups.map((g) => ({
        ...g,
        shifts: g.shifts.filter((s) => s !== EMPTY),
      })),
    }
    onMappingChange(mapping, { dayCol: newDayCol, dateCol: newDateCol, groups: newGroups })
  }

  function setDay(v) { setDayCol(v); update(v, dateCol, groups) }
  function setDate(v) { setDateCol(v); update(dayCol, v, groups) }

  function updateGroup(id, field, value) {
    const next = groups.map((g) => g.id === id ? { ...g, [field]: value } : g)
    setGroups(next)
    update(dayCol, dateCol, next)
  }

  function updateShift(id, index, value) {
    const next = groups.map((g) => {
      if (g.id !== id) return g
      const shifts = [...g.shifts]
      shifts[index] = value
      return { ...g, shifts }
    })
    setGroups(next)
    update(dayCol, dateCol, next)
  }

  function addGroup() {
    const next = [...groups, makeGroup()]
    setGroups(next)
    update(dayCol, dateCol, next)
  }

  function removeGroup(id) {
    const next = groups.filter((g) => g.id !== id)
    setGroups(next)
    update(dayCol, dateCol, next)
  }

  return (
    <div className={styles.wrapper}>
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Base columns</h3>
        <p className={styles.sectionDesc}>These apply to every row in the sheet.</p>

        <div className={styles.fieldGrid}>
          <label htmlFor="col-day" className={styles.label}>
            Day of week
            <span className={styles.hint}>e.g. Mon, Tue…</span>
          </label>
          <ColSelect id="col-day" value={dayCol} onChange={setDay} headers={headers} />

          <label htmlFor="col-date" className={styles.label}>
            Date
            <span className={styles.hint}>e.g. 11 May 2026</span>
          </label>
          <ColSelect id="col-date" value={dateCol} onChange={setDate} headers={headers} />
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Event groups</h3>
        <p className={styles.sectionDesc}>
          Each group maps one repeating block of columns — event name, classroom, and up to 3 shift slots.
          Add one group per event block in your sheet.
        </p>

        <div className={styles.groupList}>
          {groups.map((group, index) => (
            <div key={group.id} className={styles.groupBlock}>
              <div className={styles.groupHeader}>
                <span className={styles.groupLabel}>Event group {index + 1}</span>
                {groups.length > 1 && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeGroup(group.id)}
                    aria-label={`Remove event group ${index + 1}`}
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
          + Add another event group
        </button>
      </section>
    </div>
  )
}
