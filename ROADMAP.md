# NUST Study App — Roadmap

> **Living document.** We update this at the end of every day (mark it ✅, note what changed).
> Mirrored in Claude's permanent memory so every session starts with this context.

## 🎯 North Star
A **simple, organized, local-first hub** that brings a NUST student's study resources into one
place — courses, assignments, habits, and per-course notes/links/past-papers — and, over time,
**integrates useful open-source study-app features/resources from GitHub**, tailored to the university.

We start with the **personal organizer** (the backbone everything hangs off), then grow the
**resources hub** (the north star), then add smart/integration features.

## 🧱 Stack
React 19 · TypeScript 6 · Vite 8 · Tailwind CSS v4 (`@tailwindcss/vite`) · Dexie/IndexedDB
(local-first) · `vite-plugin-pwa` (installable/offline) · `lucide-react` icons · npm.

## 🤝 How we work
- **Two-agent workflow** (authoritative: `AGENTS.md`) — ownership split by directory. **ox-alpha** (OpenCode) plans, owns data/logic/infra (`src/db.ts`, `src/data/**`, `src/lib/**`, config/tooling), and reviews Claude's UI. **Claude** owns UI (`src/components/**`, `src/layout/**`, `src/pages/**`, `src/index.css`, `index.html`) and reviews ox-alpha's plans + data work. Each side reviews the other's branch; UI branches merge by Claude, data branches by ox-alpha, only once the gate is green.
- **Build & explain** — code is written *and* explained (what + why) so it's a learning project.
- **One day = one shippable increment = one commit + push** to GitHub.
- Local-first & privacy-focused: all data stays in the browser (IndexedDB); no server.

---

## 📅 Progress Tracker

### Phase 0 — Foundation
- [x] **Day 0 — Scaffold & stack verification.** Vite + React + TS + Tailwind v4 + Dexie + PWA wired; `db.ts` (`Course`, `Habit`); `App.tsx` stack-test harness.
- [x] **Day 0.5 — Git & GitHub.** Re-rooted git at the project (home-folder repo disabled), hardened `.gitignore`, first clean commit, connected + pushed to `kahmedbscs25seecs-bot/sttudyplanner`.

### Phase 1 — Organizer foundation (the backbone)
- [x] **Day 1 — Real app shell.** Retired the Day-0 harness; **React Router** (URL routing + back/deep-link), **responsive shell** (desktop sidebar + mobile bottom tabs), **light "technical-notebook" design system** (Space Grotesk / Inter / JetBrains Mono, cobalt `#3A4DE0` accent, tokens via Tailwind `@theme`), reusable UI primitives (Button, Card, Input, PageHeader, EmptyState). Empty Courses / Habits / Tasks views navigable + a NotFound route. Verified: build + lint clean, responsive + routing + focus ring checked in-browser.
- [x] **Day 1.5 — Foundation hardening (ox-alpha supervision pass).** Strict TS (+ `noUncheckedIndexedAccess`); global **ErrorBoundary** with recovery UI; **test infra** (Vitest + RTL + fake-indexeddb, 11 tests incl. DB CRUD round-trips); real **branded PWA icons** (192/512 + maskable) replacing the missing-file manifest entries and the leftover stock Vite favicon; fonts now **self-hosted** via Fontsource (offline-safe, no Google Fonts requests) and precached by the SW; ESLint upgraded to **type-checked** rules; README rewritten for the real project. Gate: lint · tsc · test · build all green.
  - *Standing rule discovered:* fake-indexeddb injects generated keys into the input object — always pass fresh object literals to Dexie calls in tests.
  - *Deferred to Day 3:* index `habits.order` when reorder lands (schema v2 bump).
- [x] **Day 2 — Courses (the spine).** Full CRUD over `Course` (code, name, credit hours, difficulty) on a frozen data-layer contract (`useCourses`/`addCourse`/`updateCourse`/`deleteCourse` in `src/data/courses.ts`; typed `DuplicateCodeError`/`ValidationError`). Responsive card grid with a monospace code chip and a signature **difficulty meter**; add/edit through a native `<dialog>` modal (platform focus-trap, Escape, inertness, focus restored to the trigger), delete behind a confirm dialog. **Single source of validation truth = the data layer** (case-insensitive duplicate guard inside a `rw` transaction); closed-set controls (credit-hours select, difficulty radio group) make out-of-range values structurally unsubmittable, leaving code/name as the only error surfaces — errors route to the right field, move focus there, and are announced via `aria-invalid` + `aria-describedby`. Keyboard-submittable; key-per-open remount resets form state (no reset-in-effect). Shipped via the two-agent workflow — data by ox-alpha, UI by Claude, cross-reviewed, merged to `main` @ `19115f2`. Gate: lint 0 · **53 tests** · tsc · build all green, plus a real-browser check (modal trap, focus restoration, error paths). *All supervisor requirements met.*
  - *Follow-ups relayed to ox-alpha (data-side, non-blocking):* none outstanding — the two API findings (bare `ValidationError.message`, exported `NAME_MAX`) already landed in `d8c4ec0` and are now consumed by the form.
- [x] **Day 3 — Habits.** CRUD + daily check-off + streaks + reorder, shipped role-swapped (Claude planned the UI and verified; ox-alpha built both layers). **Data:** schema v2 — `order` indexed (boolean index dropped: booleans aren't valid IndexedDB keys), new `completions` table with composite primary key `[habitId+date]` for engine-level uniqueness, tested v1→v2 upgrade with legacy-row backfill; pure streak math in `src/lib/streaks.ts` (yesterday-grace rule pinned by tests, DST-safe calendar stepping, future-dated drift ignored); cascade delete in one transaction; shared `ValidationError` moved to `src/data/errors.ts`. **UI:** real `<input type=checkbox>` check-off (Space-toggle, absolute-state updates so double-clicks can't un-check), `Flame + N` badge absent at zero, buttons-first reorder with drag seam deferred, single-column list, both-query loading gate, per-open key remount. **Browser pass caught a real bug jsdom couldn't:** `showModal()` focused the header ✕, not Cancel — fixed with an explicit focus effect in `ConfirmDialog` (+ `Button` now takes a React-19 ref prop). Gate: lint 0 · **118 tests** · tsc · build green; 10/10 headless-Edge interaction checks incl. keyboard-only flow, focus trap/Escape/restoration, zero console errors. Merged to `main` @ `ac73685`.
  - *Test-infra note:* gate made deterministic on the weak dev machine — serial test files (`fileParallelism: false`) + 8s RTL async timeout; slow ≠ hung.
  - *Deferred:* drag-and-drop reorder (fine-pointer enhancement via a future `move(ids, from, to)`); habit archive/pause UI once anything can set `active:false`.
- [ ] **Day 4 — Tasks / Assignments.** New `Task` table (title, courseId, dueDate, status, notes); "due soon" sorting; mark complete. **Deletion policy set Day 3:** log-type children cascade with their parent (habit → completions); user-content children (tasks/resources) will prompt before a course is removed.

### Phase 2 — Resources hub (the north star)
- [ ] **Day 5 — Resources per course.** New `Resource` table (title, url/file, type: note|link|past-paper|video|repo, courseId, tags). Organize resources under each course.
- [ ] **Day 6 — Unified resource library.** One searchable/filterable view across all courses (type/course/tag); seed a few curated NUST-relevant open resources.
- [ ] **Day 7 — Dashboard/overview.** Home screen: today's tasks, habit streaks, upcoming deadlines, recent resources.

### Phase 3 — Polish & smart features
- [ ] **Day 8 — Study prioritization.** Suggest what to study next from difficulty × credit hours × nearest deadline.
- [ ] **Day 9 — Backup + PWA polish.** JSON export/import, settings page, add missing `pwa-192x192.png`, verify offline/installable.
- [ ] **Day 10 — UX pass.** Empty states, onboarding, responsiveness, final visual polish.

### Phase 4 — Integration / stretch (the ambitious vision)
- [ ] Curated **NUST resource pack** (seed data by department/course).
- [ ] **Integrate open-source study-app resources from GitHub** (scope concretely on arrival).
- [ ] Optional **NUST LMS import** adapter (the `source:'lms'` hint already in the schema). **Invariant:** LMS writes must route through `src/data/courses.ts` (or normalize codes identically) — the case-insensitive duplicate guard assumes stored codes are trimmed + uppercase.
- [ ] Notifications + simple analytics/charts.

*The roadmap is a guide, not a contract — any day can be re-scoped as we learn.*

---

## 🔎 Repo notes
- The old accidental home-directory git repo was disabled (renamed to `~/.git-DISABLED-backup`); this project is now its own repo. Don't run git from `C:\Users\khawa` root.
- Commit identity is set **locally** to a GitHub no-reply email for privacy. Change with
  `git config user.name "…"` / `git config user.email "…"` in the repo if you want commits to link to your profile.
