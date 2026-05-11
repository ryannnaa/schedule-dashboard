# Shift Scheduler

A personal shift calendar dashboard that reads your team's Excel scheduling sheet and displays your assigned shifts in a clean monthly calendar view — no more manually cross-referencing rows and columns to find your schedule.

## The Problem

Scheduling sheets in Excel work well for coordinators managing the full team, but they're hard to read for individual staff. Finding your own shifts means scanning across dozens of columns and down dozens of rows every time the schedule is updated.

Shift Scheduler solves this by letting you upload the Excel file, map the relevant columns once, select your initials, and instantly see only your shifts on a proper calendar.

---

## Features

- **Excel upload** — drag and drop your `.xlsx` scheduling file, no conversion needed
- **Dynamic column mapper** — point-and-click to tell the app which columns hold dates, event names, classrooms, and shift slots; works with any repeating column structure
- **Personal calendar view** — select your initials to highlight only your shifts for the month
- **Staff roster auto-detection** — all staff initials are detected automatically from the shift columns
- **Export to calendar** — download an `.ics` file to import your shifts into Google Calendar, Apple Calendar, or Outlook *(Phase 4)*

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Excel parsing | SheetJS (xlsx) |
| Styling | CSS variables, no UI library |
| Hosting | GitHub Pages |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/shift-scheduler.git
cd shift-scheduler

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Deploying to GitHub Pages

1. Open `vite.config.js` and update the `base` field to match your repository name:

```js
base: '/your-repo-name/',
```

2. Run the deploy command:

```bash
npm run deploy
```

Your app will be live at `https://YOUR_USERNAME.github.io/your-repo-name/`.

---

## How to Use

1. **Upload** your Excel scheduling sheet (`.xlsx`)
2. **Map columns** — select which columns correspond to Day, Date, Event Name, Classroom, and each Shift slot. Add one mapping group per repeating event block in your sheet
3. **Preview** — verify the parsed data and check that all staff initials are detected correctly
4. **Build calendar** — select your initials and view your personal shift calendar for the month

---

## Excel Sheet Format

The app is designed to work with scheduling sheets structured like this:

| Col A | … | Col I | Col J | Col K | Col L | Col M | Col N | Col O | … |
|---|---|---|---|---|---|---|---|---|---|
| Day | | Date | Event Name | Classroom | Shift 1 | Shift 2 | Shift 3 | Next Event | |

- Each row represents one day
- Events repeat across columns in groups of 5 (Event Name, Classroom, Shift 1, Shift 2, Shift 3)
- Shift cells contain staff initials (e.g. `RT`, `JL`)
- The column mapper lets you configure any variation of this structure without changing code

---

## Project Structure

```
shift-scheduler/
├── public/
├── src/
│   ├── components/       # React components (Uploader, Mapper, Calendar, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Excel parsing, date helpers, ics export
│   ├── App.jsx           # Root component and phase routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles and CSS variables
├── PHASES.md             # Full project phase breakdown
├── index.html
├── vite.config.js
└── package.json
```

---

## Roadmap

See [PHASES.md](./PHASES.md) for the full breakdown of planned features and development phases.

---

## Contributing

This project is built incrementally in phases. If you'd like to contribute, please read `PHASES.md` first to understand the current state and what's coming next, then open an issue or pull request.

---

## License

MIT
