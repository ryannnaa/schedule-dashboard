# Schedule Dashboard

A personal shift calendar dashboard that reads your team's Excel scheduling sheet and displays assigned shifts in a clean monthly calendar view — no more manually cross-referencing rows and columns to find your schedule.

## The Problem

Scheduling sheets in Excel work well for coordinators managing the full team, but they're hard to read for individual staff. Finding your own shifts means scanning across dozens of columns and down dozens of rows every time the schedule is updated.

Schedule Dashboard solves this by letting you upload the Excel file, map the relevant columns once, select your initials, and instantly see only your shifts on a proper calendar. Column mappings are saved to the cloud so you never have to configure them again.

---

## Features

- **Excel upload** — drag and drop your `.xlsx` scheduling file, no conversion needed
- **Dynamic column mapper** — point-and-click to tell the app which columns hold dates, event names, classrooms, and shift slots; works with any repeating column structure
- **Repeat pattern** — define one event block template and auto-generate the rest by setting a repeat count and stride; supports up to 9 event blocks per row
- **Date range filter** — optionally limit the parsed schedule to a specific date range
- **Three viewing modes** — full schedule (all staff), personal (your shifts only), or comparison (2–3 people side by side for swap planning)
- **Monthly calendar view** — compact day cells with classroom codes and shift badges, expandable to full detail on click
- **Day modal** — click any day to see all event details, classrooms, shift slot times, and conflict warnings
- **Conflict detection** — flags days where the same staff member is assigned to the same shift slot more than once across event blocks
- **Mon/Sun week start** — toggle between Monday-first and Sunday-first calendar layout, saved to your browser
- **Export to calendar** — download an `.ics` file to import your shifts directly into Outlook, Google Calendar, or Apple Calendar, with correct shift times per slot
- **Saved mappings** — save and reload named column configurations via Supabase, so returning users never have to re-map columns

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 8 |
| Excel parsing | SheetJS (xlsx) |
| Database | Supabase (Postgres) |
| Styling | CSS Modules, no UI library |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm 9+
- A Supabase project (free tier is sufficient)

### Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)

2. Run the following in the Supabase SQL editor:

```sql
create table mappings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  mapping    jsonb not null,
  created_at timestamptz default now()
);

alter table mappings enable row level security;

create policy "Allow public read"   on mappings for select using (true);
create policy "Allow public insert" on mappings for insert with check (true);
create policy "Allow public update" on mappings for update using (true) with check (true);
create policy "Allow public delete" on mappings for delete using (true);

grant select, insert, update, delete on public.mappings to anon;
grant usage on schema public to anon;
```

3. From **Settings → API → Legacy API Keys**, copy the `anon` JWT key (starts with `eyJ`)

### Installation

```bash
# Clone the repository
git clone https://github.com/ryannnaa/schedule-dashboard.git
cd schedule-dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Fill in your Supabase URL and anon key in .env.local

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## How to Use

1. **Upload** your Excel scheduling sheet (`.xlsx`)
2. **Map columns** — select which columns correspond to Day, Date, Event Name, Classroom, and each Shift slot. Set the repeat count and stride to auto-generate all event blocks from one template
3. **Save your mapping** — give it a name and save it to the cloud for next time
4. **Preview** — verify the parsed data and check that all staff initials are detected
5. **Select staff** — choose your initials (or up to 3 people for comparison view)
6. **View calendar** — browse your monthly schedule, click any day for full details
7. **Export** — download an `.ics` file to import into your calendar app

---

## Excel Sheet Format

The app is designed to work with scheduling sheets structured like this:

| Col A | … | Col I | Col J | Col K | Col L | Col M | Col N | Col O | … |
|---|---|---|---|---|---|---|---|---|---|
| Day | | Date | Event Name | Classroom | Shift 1 | Shift 2 | Shift 3 | Next Event | |

- Each row represents one day
- Events repeat across columns in groups (Event Name, Classroom, Shift 1, Shift 2, Shift 3)
- Shift cells contain staff initials (e.g. `RT`, `JL`)
- The column mapper lets you configure any variation of this structure

### Shift Times

Shift slot times are fixed at:

| Slot | Time |
|---|---|
| Shift 1 | 8:00am – 9:30am |
| Shift 2 | 12:30pm – 2:00pm |
| Shift 3 | 4:30pm – 6:00pm |

These are defined in `src/utils/ics.js` and can be updated there if times change.

---

## Project Structure

```
schedule-dashboard/
├── public/
├── src/
│   ├── components/         # React UI components
│   │   ├── CalendarCell    # Individual day cell in the grid
│   │   ├── CalendarHeader  # Month nav + week start toggle
│   │   ├── CalendarView    # Monthly calendar grid
│   │   ├── ColumnMapper    # Column mapping UI
│   │   ├── DayModal        # Full day detail overlay
│   │   ├── EventChip       # Compact event row in a cell
│   │   ├── ExportButton    # .ics download trigger
│   │   ├── FileUploader    # Drag-and-drop Excel upload
│   │   ├── MappingManager  # Save/load/delete named mappings
│   │   ├── SchedulePreview # Parsed data preview table
│   │   ├── StaffSelector   # Multi-select staff picker
│   │   └── StepIndicator   # Step progress indicator
│   ├── context/
│   │   └── ScheduleContext # Global state, conflict detection, filtered days
│   ├── hooks/
│   │   ├── useLocalStorage # Persist state to localStorage
│   │   └── useMappings     # Supabase mapping CRUD operations
│   ├── lib/
│   │   └── supabase        # Supabase client initialisation
│   ├── utils/
│   │   ├── excel           # File reading, schedule parsing, date normalisation
│   │   └── ics             # .ics file generation and download
│   ├── App.jsx             # Root component and phase routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles and CSS variables
├── PHASES.md               # Development phase breakdown
├── index.html
├── vite.config.js
└── package.json
```

---

## Roadmap

See [PHASES.md](./PHASES.md) for the full development history and future ideas.

---

## License

MIT
