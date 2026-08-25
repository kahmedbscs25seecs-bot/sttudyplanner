# NUST Study App

A simple, organized, **local-first hub** that brings a NUST student's study life into one place — courses, assignments, habits, and per-course notes/links/past-papers. All data stays in your browser (IndexedDB); there is no server and no account.

The master plan lives in [ROADMAP.md](./ROADMAP.md) — a living day-by-day tracker we update as we ship.

## Stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| UI        | React 19 · TypeScript 6 (strict)                    |
| Build     | Vite 8 · `vite-plugin-pwa` (installable + offline)  |
| Styling   | Tailwind CSS v4 (`@theme` design tokens)            |
| Data      | Dexie 4 over IndexedDB (local-first)                |
| Icons     | lucide-react                                        |
| Fonts     | Self-hosted variable fonts via Fontsource           |
| Tests     | Vitest · React Testing Library · fake-indexeddb     |

## Getting started

```bash
npm install
npm run dev        # start dev server
```

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                      |
| `npm run build`   | Type-check (`tsc -b`) then production bundle  |
| `npm run lint`    | ESLint with type-aware rules                  |
| `npm test`        | Run all tests once (Vitest)                   |
| `npm run test:watch` | Watch mode                                 |
| `npm run preview` | Serve the production build locally            |

## Project structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx   # global crash screen with recovery actions
│   └── ui/                 # Button, Card, Input, PageHeader, EmptyState
├── layout/                 # app shell: Sidebar (desktop), BottomTabs (mobile)
├── pages/                  # Dashboard, Courses, Habits, Tasks, NotFound
├── test/                   # setup file + component/route tests
├── db.ts                   # Dexie schema (single source of truth for data)
├── index.css               # design tokens (@theme) + base styles
└── main.tsx                # router + error boundary wiring
```

## Conventions

- **Design tokens only** — use Tailwind utilities generated from `@theme` (`bg-paper`, `text-ink`, `text-muted`, `border-line`, `bg-accent`, `font-display`…); no raw hex values in components.
- **TypeScript is strict**, including `noUncheckedIndexedAccess`.
- **Reuse the UI primitives** in `components/ui/`; extend them rather than duplicating.
- Navigation lives in one place: `src/layout/navItems.ts`.

## How this repo is built

Two-agent workflow: one agent plans & implements each increment ("Day N" in the roadmap), then a supervisor agent reviews it — running the full gate below, debugging failures, and fixing issues directly — before anything is committed.

**Definition of done for every increment:** `lint` ✅ · `tsc -b` ✅ · `test` ✅ · `build` ✅ · checked responsive + keyboard-accessible in the browser.
