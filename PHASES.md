# Project Phases

This document tracks the planned development of Shift Scheduler, broken into discrete phases that can be built and tested independently. Each phase builds on the previous one.

---

## Phase 1 — Excel Upload & Column Mapper

**Goal:** Get data from the Excel sheet into the app in a structured, reliable way.

**Status:** 🔵 In progress

### Features
- Drag-and-drop or click-to-browse `.xlsx` file upload
- Automatic sheet parsing using SheetJS
- Column header detection and display in dropdown selectors
- Dynamic column mapper UI:
  - Base columns: Day of week, Date
  - Repeating event groups: Event Name, Classroom, Shift slots (up to 3)
  - Ability to add or remove event groups to match the sheet's structure
- Parsed data preview (first 5 rows) before proceeding
- Auto-detection of all unique staff initials across all shift columns
- Column mapping saved to `localStorage` so it persists between sessions

### Key decisions
- The mapper is intentionally generic — it does not hardcode column letters. This makes the app reusable for other scheduling sheets with different structures.
- Each repeating block of columns is called an "event group". The user defines how many groups their sheet has.

### Acceptance criteria
- [ ] User can upload any `.xlsx` file
- [ ] All columns are listed in the mapper dropdowns, labelled with their header text
- [ ] User can define one or more event groups
- [ ] Preview table correctly reflects the column mapping
- [ ] All staff initials are detected and displayed
- [ ] Mapping persists on page refresh

---

## Phase 2 — Data Parser & State Management

**Goal:** Transform the raw mapped data into a clean, normalised schedule structure that the rest of the app can consume.

**Status:** ⚪ Planned

### Features
- Parse each Excel row into a structured day object:
  ```json
  {
    "date": "2026-05-11",
    "dayOfWeek": "Mon",
    "events": [
      {
        "name": "Morning Class",
        "classroom": "Room A",
        "shifts": ["RT", "JL", ""]
      }
    ]
  }
  ```
- Date normalisation — handle multiple date formats from Excel (serial numbers, text strings, ISO dates)
- Validation layer — flag rows with missing dates, unrecognised initials, or empty event names
- Global app state using React Context (schedule data, column mapping, selected staff member)
- Staff roster derived from parsed data (sorted, deduplicated list of all initials found)

### Key decisions
- Parsing is separated from the UI layer so it can be unit tested independently.
- The parsed schedule is the single source of truth for Phase 3 and beyond.

### Acceptance criteria
- [ ] Every row is correctly parsed into a day object
- [ ] Dates from Excel serial format are correctly converted
- [ ] Rows with data issues are flagged with a visible warning, not silently dropped
- [ ] Staff roster is complete and sorted
- [ ] Selecting a different file resets state cleanly

---

## Phase 3 — Personal Calendar View

**Goal:** Display the parsed schedule as a monthly calendar, filtered to a selected staff member.

**Status:** ⚪ Planned

### Features
- Standard monthly calendar grid (7 columns, Mon–Sun header)
- Each day cell shows:
  - Events the selected person is scheduled for
  - Event name, classroom, and which shift slot they are in
  - A muted view of other events they are not part of (for context)
- Staff selector — dropdown or pill buttons to switch between team members
- Month navigation — previous / next arrows, current month label
- Today's date highlighted
- Empty days (weekends or holidays) displayed cleanly
- Responsive layout — readable on tablet and desktop

### Key decisions
- The calendar only shows one person at a time, keeping it scannable at a glance.
- Non-assigned events are shown at reduced opacity rather than hidden, so the user still has full context of the day.

### Acceptance criteria
- [ ] Calendar renders correctly for the month derived from the uploaded data
- [ ] Selecting different initials updates the calendar instantly
- [ ] Days with no shifts for the selected person are visually distinct
- [ ] Month navigation works and does not break on edge cases (e.g. months with 28 or 31 days)
- [ ] The calendar is readable on a 768px wide screen

---

## Phase 4 — Calendar Export (.ics)

**Goal:** Let staff export their personal shift schedule directly into their calendar app of choice.

**Status:** ⚪ Planned

### Features
- Generate a standards-compliant `.ics` file containing only the selected person's shifts
- Each shift becomes a calendar event with:
  - Title: Event name + classroom (e.g. "Morning Class — Room A")
  - Date: Correct calendar date
  - Description: Shift slot and co-workers scheduled for the same event
- One-click download button on the calendar view
- Option to export the full month or a selected date range

### Key decisions
- `.ics` is supported by Google Calendar, Apple Calendar, and Outlook with no plugins required — maximising compatibility without building integrations.
- The file is generated entirely client-side; no data is sent to any server.

### Acceptance criteria
- [ ] Generated `.ics` file imports correctly into Google Calendar
- [ ] Generated `.ics` file imports correctly into Apple Calendar
- [ ] Event titles and dates are accurate
- [ ] Export respects the currently selected staff member
- [ ] No data leaves the browser

---

## Future Ideas

These are not committed phases but may be considered after Phase 4 is complete.

| Idea | Description |
|---|---|
| **Saved mappings** | Name and save column mappings for different sheet templates, switchable from a dropdown |
| **Multi-person view** | Side-by-side comparison of two staff members' schedules |
| **Conflict detection** | Highlight days where a person is double-booked or a shift slot is unfilled |
| **Print view** | Clean single-page print stylesheet for the calendar |
| **Mobile app** | Wrap the app in Capacitor for iOS/Android distribution |

---

## Development Notes

### Running locally
```bash
npm install
npm run dev
```

### Building for production
```bash
npm run build
```

### Deploying to GitHub Pages
```bash
npm run deploy
```

> Remember to set the correct `base` in `vite.config.js` before deploying (see README).

### Branch convention
| Branch | Purpose |
|---|---|
| `main` | Stable, deployable code |
| `phase/1-upload-mapper` | Phase 1 development |
| `phase/2-parser` | Phase 2 development |
| `phase/3-calendar` | Phase 3 development |
| `phase/4-export` | Phase 4 development |
