import * as XLSX from 'xlsx'

/**
 * Reads an uploaded File object and returns the first sheet
 * as a 2D array (array of rows, each row an array of cell values).
 */
export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        resolve({ data, sheetName })
      } catch (err) {
        reject(new Error('Could not read the Excel file. Make sure it is a valid .xlsx or .xls file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read the file.'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Given the raw 2D sheet data and a column mapping config,
 * returns a structured array of day objects.
 *
 * mapping shape:
 * {
 *   dayCol: number,
 *   dateCol: number,
 *   groups: [{ event: number, classroom: number, shifts: number[] }],
 *   repeatCount: number,   // how many times the first group pattern repeats
 *   repeatStride: number,  // column width of each repeated block
 *   dateFrom: string|null, // ISO string - only include rows on or after this date
 *   dateTo:   string|null, // ISO string - only include rows on or before this date
 * }
 */
export function parseSchedule(sheetData, mapping) {
  const [, ...rows] = sheetData

  const allGroups = buildGroups(mapping)

  const dateFrom = mapping.dateFrom ? new Date(mapping.dateFrom) : null
  const dateTo   = mapping.dateTo   ? new Date(mapping.dateTo)   : null
  if (dateFrom) dateFrom.setHours(0, 0, 0, 0)
  if (dateTo)   dateTo.setHours(23, 59, 59, 999)

  return rows
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const rawDate = row[mapping.dateCol]
      const date = normaliseDate(rawDate)

      const events = allGroups
        .map((group) => ({
          name:      String(row[group.event]     ?? '').trim(),
          classroom: String(row[group.classroom] ?? '').trim(),
          shifts: group.shifts
            .map((colIdx) => String(row[colIdx] ?? '').trim())
            .filter(Boolean),
        }))
        .filter((e) => e.name || e.shifts.length > 0)

      return {
        day: String(row[mapping.dayCol] ?? '').trim(),
        rawDate,
        date,
        events,
      }
    })
    .filter((day) => {
      if (!day.date) return true
      if (dateFrom && day.date < dateFrom) return false
      if (dateTo   && day.date > dateTo)   return false
      return true
    })
}

/**
 * Expands the groups array using repeatCount + repeatStride so the user
 * only has to define the first event block manually.
 */
function buildGroups(mapping) {
  const { groups = [], repeatCount = 1, repeatStride = 0 } = mapping
  if (!groups.length) return []

  const base   = groups[0]
  const manual = groups.slice(1)
  const count  = Math.max(1, Number(repeatCount))
  const stride = Number(repeatStride)

  const generated = Array.from({ length: count }, (_, i) => {
    if (i === 0) return base
    const offset = i * stride
    return {
      ...base,
      id:        'auto-' + i,
      event:     base.event     !== '' ? Number(base.event)     + offset : '',
      classroom: base.classroom !== '' ? Number(base.classroom) + offset : '',
      shifts:    base.shifts.map((s) => Number(s) + offset),
    }
  })

  return [...generated, ...manual]
}

/**
 * Extracts all unique staff initials from the parsed schedule.
 */
export function extractStaff(parsedDays) {
  const initials = new Set()
  parsedDays.forEach((day) =>
    day.events.forEach((event) =>
      event.shifts.forEach((s) => { if (s) initials.add(s) })
    )
  )
  return [...initials].sort()
}

/**
 * Normalises various date formats that Excel may produce into
 * a plain JS Date object, or null if unrecognisable.
 */
function normaliseDate(value) {
  if (!value && value !== 0) return null
  // With cellDates disabled, SheetJS never produces Date objects.
  // This branch is a safety fallback only.
  if (value instanceof Date) {
    if (isNaN(value)) return null
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value)
    if (d) return new Date(d.y, d.m - 1, d.d)
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!isNaN(parsed)) return parsed
  }
  return null
}

/**
 * Returns column letter(s) from a zero-based index (0 = A, 25 = Z, 26 = AA).
 */
export function colIndexToLetter(index) {
  let letter = ''
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}
