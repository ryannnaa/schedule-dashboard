import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { parseSchedule, extractStaff } from '../utils/excel'

const ScheduleContext = createContext(null)

/**
 * Provides the parsed schedule, staff roster, and selected staff member
 * to the entire component tree. All Phase 3+ components read from here
 * instead of receiving props.
 */
export function ScheduleProvider({ children }) {
  const [fileInfo, setFileInfo]       = useState(null)  // { file, data, sheetName }
  const [mapping,  setMapping]        = useState(null)  // clean mapping config
  const [rawMapping, setRawMapping]   = useState(null)  // raw mapper state (for persistence)
  const [selectedStaff, setSelectedStaff] = useState(null) // initials string e.g. "RT"

  // Re-parse whenever file or mapping changes
  const parsedDays = useMemo(() => {
    if (!fileInfo?.data || !mapping) return []
    try {
      return parseSchedule(fileInfo.data, mapping)
    } catch (err) {
      console.error('Schedule parse error:', err)
      return []
    }
  }, [fileInfo, mapping])

  // Derive staff list from parsed data
  const staffList = useMemo(() => extractStaff(parsedDays), [parsedDays])

  // Derive date range from parsed data for calendar navigation
  const dateRange = useMemo(() => {
    const dates = parsedDays.map(d => d.date).filter(Boolean)
    if (!dates.length) return { earliest: null, latest: null }
    return {
      earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
      latest:   new Date(Math.max(...dates.map(d => d.getTime()))),
    }
  }, [parsedDays])

  // Validation — flag days that have event data but no parseable date
  const warnings = useMemo(() => {
    return parsedDays
      .filter(d => !d.date && d.events.length > 0)
      .map(d => ({
        day: d.day,
        rawDate: String(d.rawDate),
        eventCount: d.events.length,
      }))
  }, [parsedDays])

  // Filter days to only those where the selected staff member has a shift
  const myDays = useMemo(() => {
    if (!selectedStaff) return []
    return parsedDays
      .map(day => ({
        ...day,
        events: day.events.filter(e =>
          e.shifts.some(s => s.toUpperCase() === selectedStaff.toUpperCase())
        ),
      }))
      .filter(day => day.events.length > 0)
  }, [parsedDays, selectedStaff])

  const loadFile = useCallback((info) => {
    setFileInfo(info)
    setSelectedStaff(null)
  }, [])

  const updateMapping = useCallback((clean, raw) => {
    setMapping(clean)
    setRawMapping(raw)
  }, [])

  const reset = useCallback(() => {
    setFileInfo(null)
    setMapping(null)
    setRawMapping(null)
    setSelectedStaff(null)
  }, [])

  const value = {
    // File
    fileInfo,
    loadFile,

    // Mapping
    mapping,
    rawMapping,
    updateMapping,

    // Parsed data
    parsedDays,
    staffList,
    dateRange,
    warnings,

    // Personal view
    selectedStaff,
    setSelectedStaff,
    myDays,

    // Actions
    reset,
  }

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  )
}

/**
 * Hook to access schedule context. Throws if used outside ScheduleProvider.
 */
export function useSchedule() {
  const ctx = useContext(ScheduleContext)
  if (!ctx) throw new Error('useSchedule must be used within a ScheduleProvider')
  return ctx
}
