# Project Phases

This document tracks the development of Schedule Dashboard, broken into discrete phases. Each phase builds on the previous one.

---

## Phase 1 — Excel Upload & Column Mapper

**Status:** ✅ Complete

### What was built
- Drag-and-drop `.xlsx` file upload with loading state and error handling
- Column mapper UI with dropdowns labelled by Excel header text
- Base columns (Day, Date) and repeating event group structure (Event Name, Classroom, up to 3 Shift slots)
- Repeat pattern — define one event block template, set a count and stride to auto-generate the rest (up to 9 blocks)
- Live column preview showing which columns each auto-generated block will read
- Optional date range filter to limit parsed rows to a specific period
- Parsed data preview showing the first 6 rows and all detected staff initials
- Column mapping persisted to `localStorage` between sessions
- Step indicator (Upload → Map columns → Preview)

### Key decisions
- Column indices are never hardcoded — the mapper stores zero-based positions making the app reusable for any sheet structure
- The repeat stride pattern means users only configure one block regardless of how many repeat across the row

---

## Phase 2 — State Management & Staff Selection

**Status:** ✅ Complete

### What was built
- `ScheduleContext` — global React Context holding file, mapping, parsed schedule, staff roster, selection state, view mode, colour assignment, conflict detection, and filtered days
- Three view modes derived from selection count:
  - **Full** — no staff selected, all events visible
  - **Personal** — 1 person selected, only their shifts shown
  - **Comparison** — 2–3 people selected, shifts shown side by side
- Multi-select staff picker with 3-person cap, colour-coded pills (blue → green → yellow in selection order)
- Per-slot conflict detection — flags staff appearing more than once in the same shift slot position across all event blocks in a row
- Conflict count displayed in the summary card (days with conflicts, not individual events)
- `filteredDays` as the single output consumed by the calendar — always shaped correctly for the active view mode with conflict annotations attached
- Step 4 added to the flow (Select staff) before the calendar

### Key decisions
- `selectedStaff` is an ordered array (not a Set) to preserve colour assignment stability
- Conflict detection runs at the day level across all event blocks — per-block detection would miss cross-block double-bookings
- `lastGoodDays` ref in context preserves the last valid parse result so mid-edit mapper changes don't blank the calendar

---

## Phase 3 — Calendar View

**Status:** ✅ Complete

### What was built
- `CalendarView` — monthly grid with `dayMap` keyed by `YYYY-MM-DD` for O(1) cell lookups
- `CalendarHeader` — month navigation and Mon/Sun week start toggle, preference saved to `localStorage`
- `CalendarCell` — compact day cell showing classroom code, up to 3 event chips, "+N more" badge, ⚠ conflict flag
- `EventChip` — compact event row with classroom label and colour-coded shift badges
- `DayModal` — full detail overlay on cell click; shows event name, classroom, per-slot breakdown (Slot 1/2/3), conflict warnings; closes on backdrop click or Escape
- Wide container (`max-width: 1280px`) for the calendar step, narrower (`760px`) for setup steps
- Today's date highlighted; days outside the current month dimmed
- Shift slot index preservation fix — removed `.filter(Boolean)` from shift parsing so empty slots retain their position

### Key decisions
- Classroom shown in compact cell (shorter than event names), full event name in modal
- `cellDates: false` in SheetJS — serial number dates are timezone-agnostic, preventing off-by-one date errors in UTC+ timezones
- `min-width: 0` on cells enforces equal column widths regardless of content

---

## Phase 4 — Calendar Export (.ics)

**Status:** ✅ Complete

### What was built
- `ics.js` — generates a standards-compliant `.ics` file from a staff member's filtered days
- Each assigned shift slot becomes a separate timed calendar event with correct start/end times
- `VTIMEZONE` block for `Asia/Singapore` embedded in the file for correct time interpretation across all calendar apps
- `ExportButton` — rendered in the calendar step actions row, adapts label to view mode, exports one file per person in comparison mode, turns green with import instructions after download
- Stable UIDs per event so re-imports don't create duplicates
- `TRANSP:OPAQUE` so events show as busy blocks

### Shift times

| Slot | Start | End |
|---|---|---|
| Shift 1 | 8:00am | 9:30am |
| Shift 2 | 12:30pm | 2:00pm |
| Shift 3 | 4:30pm | 6:00pm |

Defined in `SHIFT_TIMES` in `src/utils/ics.js`.

---

## Phase 5 — Backend & Saved Mappings

**Status:** ✅ Complete

### What was built
- Supabase Postgres database with a `mappings` table storing named column configurations as JSONB
- Row Level Security with public read/write policies (auth-free, global shared mappings)
- `supabase.js` — Supabase JS client initialised from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `useMappings` hook — fetch on mount, upsert by name (overwrite if name exists), delete by id
- `MappingManager` — rendered at the top of the column mapper step:
  - Lists all saved mappings with name, date saved, Load and Delete buttons
  - Delete confirmation inline (no modal)
  - Name input + Save button to persist the current mapping
  - Loading a saved mapping instantly repopulates all column selects
- Deployment to Vercel with environment variables for Supabase credentials

### Database schema

```sql
create table mappings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  mapping    jsonb not null,
  created_at timestamptz default now()
);

grant select, insert, update, delete on public.mappings to anon;
grant usage on schema public to anon;
```

### Key decisions
- Schema designed for easy auth migration — adding a `user_id` column and enabling per-user RLS policies is the only change needed to move from shared to per-user mappings
- Upsert by name means saving with an existing name updates it rather than creating a duplicate
- Legacy Supabase anon JWT key (`eyJ...`) required for PostgREST access — publishable keys (`sb_publishable_...`) are not yet fully supported by the JS client for direct database queries

---

## Future Ideas

| Idea | Description |
|---|---|
| **Per-user mappings** | Add Supabase Auth (magic link) and `user_id` to the mappings table so each user manages their own saved configs |
| **Conflict highlighting in calendar** | Visually distinguish conflicted days in the grid, not just in the modal |
| **Print view** | Clean single-page print stylesheet for the monthly calendar |
| **Multi-sheet support** | Allow the user to select which sheet to read from multi-tab Excel files |
| **Adjustable shift times** | Let users configure shift slot times in the UI rather than editing `ics.js` |
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

### Branch convention
| Branch | Purpose |
|---|---|
| `main` | Stable, deployable code |
| `phase/1-upload-mapper` | Phase 1 development |
| `phase/2-parser` | Phase 2 development |
| `phase/3-calendar` | Phase 3 development |
| `phase/4-export` | Phase 4 development |
| `phase/5-backend` | Phase 5 development |
