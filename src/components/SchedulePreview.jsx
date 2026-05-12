import styles from './SchedulePreview.module.css'

export default function SchedulePreview({ parsedDays, staffList }) {
  const preview = parsedDays.slice(0, 6)

  return (
    <div className={styles.wrapper}>
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Detected staff</h3>
        <div className={styles.pillRow}>
          {staffList.length === 0 ? (
            <p className={styles.empty}>No initials found — check your shift column mapping.</p>
          ) : (
            staffList.map((initial) => (
              <span key={initial} className={styles.pill}>{initial}</span>
            ))
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Parsed schedule — first {preview.length} rows</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Event</th>
                <th>Room</th>
                <th>Shifts</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((day, di) =>
                day.events.length === 0 ? (
                  <tr key={di}>
                    <td>{day.day}</td>
                    <td>{formatDate(day.date) || String(day.rawDate)}</td>
                    <td colSpan={3} className={styles.noEvents}>No events</td>
                  </tr>
                ) : (
                  day.events.map((event, ei) => (
                    <tr key={`${di}-${ei}`}>
                      {ei === 0 && (
                        <>
                          <td rowSpan={day.events.length}>{day.day}</td>
                          <td rowSpan={day.events.length}>{formatDate(day.date) || String(day.rawDate)}</td>
                        </>
                      )}
                      <td>{event.name || <span className={styles.noEvents}>—</span>}</td>
                      <td>{event.classroom || <span className={styles.noEvents}>—</span>}</td>
                      <td>
                        <div className={styles.shiftTags}>
                          {event.shifts.map((s, si) => (
                            <span key={si} className={styles.shiftTag}>{s}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
        {parsedDays.length > 6 && (
          <p className={styles.more}>…and {parsedDays.length - 6} more rows</p>
        )}
      </section>
    </div>
  )
}

function formatDate(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
