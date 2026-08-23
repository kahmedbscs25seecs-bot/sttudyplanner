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
- **Build & explain** — code is written *and* explained (what + why) so it's a learning project.
- **One day = one shippable increment = one commit + push** to GitHub.
- Local-first & privacy-focused: all data stays in the browser (IndexedDB); no server.

---

## 📅 Progress Tracker

### Phase 0 — Foundation
- [x] **Day 0 — Scaffold & stack verification.** Vite + React + TS + Tailwind v4 + Dexie + PWA wired; `db.ts` (`Course`, `Habit`); `App.tsx` stack-test harness.
- [x] **Day 0.5 — Git & GitHub.** Re-rooted git at the project (home-folder repo disabled), hardened `.gitignore`, first clean commit, connected + pushed to `kahmedbscs25seecs-bot/sttudyplanner`.

### Phase 1 — Organizer foundation (the backbone)
- [ ] **Day 1 — Real app shell.** Retire the Day-0 harness; layout (header + nav), view routing, dark theme, reusable UI primitives (Button, Card, Input). Empty Courses / Habits / Tasks views navigable.
- [ ] **Day 2 — Courses (the spine).** Full CRUD over `Course` (code, name, credit hours, difficulty); clean list/grid. Everything links to a course.
- [ ] **Day 3 — Habits.** CRUD + daily check-off + streaks + reorder; add a `completions` table (habitId + date).
- [ ] **Day 4 — Tasks / Assignments.** New `Task` table (title, courseId, dueDate, status, notes); "due soon" sorting; mark complete.

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
- [ ] Optional **NUST LMS import** adapter (the `source:'lms'` hint already in the schema).
- [ ] Notifications + simple analytics/charts.

*The roadmap is a guide, not a contract — any day can be re-scoped as we learn.*

---

## 🔎 Repo notes
- The old accidental home-directory git repo was disabled (renamed to `~/.git-DISABLED-backup`); this project is now its own repo. Don't run git from `C:\Users\khawa` root.
- Commit identity is set **locally** to a GitHub no-reply email for privacy. Change with
  `git config user.name "…"` / `git config user.email "…"` in the repo if you want commits to link to your profile.
