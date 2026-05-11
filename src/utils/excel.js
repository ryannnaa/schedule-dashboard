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
        const workbook = XLSX.read(e.target.result, { type: 'array', cellDates: true })
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
 *   groups: [{ event: number, classroom: number, shifts: number[] }]
 * }
 */
export function parseSchedule(sheetData, mapping) {
  const [, ...rows] = sheetData // skip header row

  return rows
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const rawDate = row[mapping.dateCol]
      const date = normaliseDate(rawDate)

      const events = mapping.groups
        .map((group) => ({
          name: String(row[group.event] ?? '').trim(),
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

  // Already a JS Date (cellDates: true)
  if (value instanceof Date) return isNaN(value) ? null : value

  // Excel serial number
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value)
    if (d) return new Date(d.y, d.m - 1, d.d)
  }

  // String — try parsing common formats
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!isNaN(parsed)) return parsed
  }

  return null
}

/**
 * Returns column letter(s) from a zero-based index (0 → A, 25 → Z, 26 → AA).
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
