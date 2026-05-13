import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { parseSchedule, extractStaff } from '../utils/excel'

const ScheduleContext = createContext(null)

// Fixed colour palette for up to 3 selected staff members.
// Intentionally distinct and accessible against both light and dark backgrounds.
export const STAFF_COLOURS = [
  { bg: "#dbeafe", text: "#60a5fa", border: "#93c5fd", label: "Blue"   },
  { bg: "#dcfce7", text: "#4ade80", border: "#86efac", label: "Green"  },
  { bg: "#fef9c3", text: "#facc15", border: "#fde047", label: "Yellow" },
]

export function ScheduleProvider({ children }) {
  const [fileInfo,    setFileInfo]   = useState(null)  // { file, data, sheetName }
  const [mapping,     setMapping]    = useState(null)  // clean mapping config
  const [rawMapping,  setRawMapping] = useState(null)  // raw mapper state (for persistence)

  // Selected staff is now an ordered array (preserves colour assignment order, max 3)
  const [selectedStaff, setSelectedStaff] = useState([])

  // --- Parsed schedule ---
  const parsedDays = useMemo(() => {
    if (!fileInfo?.data || !mapping) return []
    try {
      return parseSchedule(fileInfo.data, mapping)
    } catch (err) {
      console.error('Schedule parse error:', err)
      return []
    }
  }, [fileInfo, mapping])

  // Staff roster derived from data
  const staffList = useMemo(() => extractStaff(parsedDays), [parsedDays])

  // Date range for calendar navigation
  const dateRange = useMemo(() => {
    const dates = parsedDays.map(d => d.date).filter(Boolean)
    if (!dates.length) return { earliest: null, latest: null }
    return {
      earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
      latest:   new Date(Math.max(...dates.map(d => d.getTime()))),
    }
  }, [parsedDays])

  // Validation warnings — rows with event data but no parseable date
  const warnings = useMemo(() => {
    return parsedDays
      .filter(d => !d.date && d.events.length > 0)
      .map(d => ({
        day:        d.day,
        rawDate:    String(d.rawDate),
        eventCount: d.events.length,
      }))
  }, [parsedDays])

  // --- View mode ---
  // 'full'       — no staff selected, show everything
  // 'personal'   — exactly 1 selected
  // 'comparison' — 2 or 3 selected
  const viewMode = useMemo(() => {
    if (selectedStaff.length === 0) return 'full'
    if (selectedStaff.length === 1) return 'personal'
    return 'comparison'
  }, [selectedStaff])

  // Colour map: initial → colour object (stable as long as selection order holds)
  const staffColourMap = useMemo(() => {
    const map = {}
    selectedStaff.forEach((initial, i) => {
      map[initial] = STAFF_COLOURS[i] ?? STAFF_COLOURS[0]
    })
    return map
  }, [selectedStaff])

  // --- Conflict detection ---
  // A conflict occurs when the same person appears more than once in the SAME
  // shift slot position across all event blocks in a single row.
  //
  // Example: RT in Block 1 Shift 1 AND RT in Block 2 Shift 1 → conflict on slot 1
  //          RT in Block 1 Shift 1 AND RT in Block 2 Shift 2 → no conflict
  //
  // Each staff member should hold at most one occurrence of each slot index per day.
  //
  // Returns: { events (annotated with per-slot conflict flags), conflicts: Set<initial> }
  function detectDayConflicts(events) {
    // slotMap[slotIndex] = { [initial]: count }
    // Tracks how many times each initial appears at each slot position across all blocks
    const slotMap = {}

    events.forEach(event => {
      event.shifts.forEach((initial, slotIndex) => {
        if (!initial) return
        const key = initial.toUpperCase()
        if (!slotMap[slotIndex]) slotMap[slotIndex] = {}
        slotMap[slotIndex][key] = (slotMap[slotIndex][key] ?? 0) + 1
      })
    })

    // Build a set of initials that are conflicted at each slot index
    // conflictedBySlot[slotIndex] = Set<initial>
    const conflictedBySlot = {}
    Object.entries(slotMap).forEach(([slotIndex, initialCounts]) => {
      conflictedBySlot[slotIndex] = new Set(
        Object.entries(initialCounts)
          .filter(([, count]) => count > 1)
          .map(([key]) => key)
      )
    })

    // Union of all conflicted initials across all slots (for the day-level flag)
    const conflicted = new Set(
      Object.values(conflictedBySlot).flatMap(set => [...set])
    )

    // Annotate each event: conflicts = set of initials that are conflicted
    // in that specific shift slot within this event block
    const annotatedEvents = events.map(event => ({
      ...event,
      conflicts: new Set(
        event.shifts
          .map((initial, slotIndex) => {
            if (!initial) return null
            const key = initial.toUpperCase()
            return conflictedBySlot[slotIndex]?.has(key) ? key : null
          })
          .filter(Boolean)
      ),
    }))

    return { events: annotatedEvents, conflicts: conflicted }
  }

  // --- Filtered days ---
  // Full view  : all days and events, with conflict detection applied
  // Personal   : days where the selected person has at least one shift
  // Comparison : days where any selected person has a shift
  const filteredDays = useMemo(() => {
    if (viewMode === 'full') {
      return parsedDays.map(day => {
        const { events, conflicts } = detectDayConflicts(day.events)
        return { ...day, events, conflicts }
      })
    }

    const selectedSet = new Set(selectedStaff.map(s => s.toUpperCase()))

    return parsedDays
      .map(day => {
        const relevantEvents = day.events.filter(event =>
          event.shifts.some(s => selectedSet.has(s.toUpperCase()))
        )
        const { events, conflicts } = detectDayConflicts(relevantEvents)
        return { ...day, events, conflicts }
      })
      .filter(day => day.events.length > 0)
  }, [parsedDays, selectedStaff, viewMode])

  // --- Selection actions ---
  const toggleStaff = useCallback((initial) => {
    setSelectedStaff(prev => {
      const exists = prev.includes(initial)
      if (exists) return prev.filter(s => s !== initial)
      if (prev.length >= 3) return prev          // cap at 3
      return [...prev, initial]
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedStaff([]), [])

  // --- File / mapping actions ---
  const loadFile = useCallback((info) => {
    setFileInfo(info)
    setSelectedStaff([])
  }, [])

  const updateMapping = useCallback((clean, raw) => {
    setMapping(clean)
    setRawMapping(raw)
  }, [])

  const reset = useCallback(() => {
    setFileInfo(null)
    setMapping(null)
    setRawMapping(null)
    setSelectedStaff([])
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

    // Selection
    selectedStaff,       // string[]
    toggleStaff,
    clearSelection,
    viewMode,            // 'full' | 'personal' | 'comparison'
    staffColourMap,      // { [initial]: { bg, text, border, label } }

    // Filtered + annotated days for the calendar
    filteredDays,

    // Actions
    reset,
  }

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext)
  if (!ctx) throw new Error('useSchedule must be used within a ScheduleProvider')
  return ctx
}
