# AGENTS.md — how we work on the NUST Study App

> **Read this first.** This is the shared working agreement between the two AI agents and the
> human owner of this project. It defines who owns what, how work flows, and what must be true
> before anything merges. OpenCode reads `AGENTS.md` automatically; Claude Code reads it too.

---

## 1. The team

| Who | Role |
|---|---|
| **Khawa** (human) | Owner. Decides scope, breaks ties, approves plans, gates pushes to GitHub. |
| **ox-alpha** (OpenCode) | **Implementer.** Builds data + UI to Claude's specs, writes the tests, runs the verification gate, merges when green. |
| **Claude** (Claude Code) | **Planner.** Writes each day's plan (data contract, UI spec, test list) and reviews on request. |

> **Workflow v2 (Day 4 onward):** one implementer, one planner. The green gate
> (§5) is the review — Claude does not re-review every merge. Plans may not
> change this agreement silently; proposals go through Khawa.

---

## 2. Ownership — by file path, not by vibe

This app is **local-first with no server**, so "frontend vs backend" has no natural line. We draw
it as a **directory boundary** instead. Ownership is a path lookup, so there is nothing to argue
about and the two agents are never in the same files.

### ox-alpha owns — data, logic, infrastructure
- `src/db.ts` — Dexie schema, versions, migrations
- `src/data/**` — data access: CRUD functions, queries, `useLiveQuery` hooks
- `src/lib/**` — pure logic: streak math, due-date sorting, prioritization, export/import
- Config & tooling: `tsconfig*.json`, `eslint.config.js`, `vite.config.ts`, `package.json`
  dependencies, PWA/service-worker config, test infrastructure
- Tests for all of the above

### Claude owns — everything the user sees
- `src/components/**` — UI primitives and composed components
- `src/layout/**` — shell, sidebar, bottom tabs
- `src/pages/**` — route views
- `src/index.css` — design tokens (`@theme`), base layer
- `index.html`
- Routing structure and navigation
- Accessibility, keyboard/focus behaviour, responsive behaviour
- Component/render tests

### Shared — announce before editing
`src/App.tsx`, `src/main.tsx`, `ROADMAP.md`, `README.md`, this file.

> **Rule:** if you need a change in the other agent's territory, **request it** in your review
> notes. Do not reach across the boundary silently. (One exception, below: on data-layer branches
> Claude may edit `src/data/**` directly as the verify step — ox-alpha then reviews those edits.)

---

## 3. The interface contract (this is what keeps us unblocked)

For any day that needs both layers, **ox-alpha's plan must declare the data-layer API up front** —
exact names, argument types, return types, and error behaviour. Example:

```ts
// src/data/courses.ts — contract declared in the plan BEFORE code is written
export function useCourses(): Course[] | undefined;
export function addCourse(input: CourseInput): Promise<number>;   // throws DuplicateCodeError
export function updateCourse(id: number, patch: Partial<CourseInput>): Promise<void>;
export function deleteCourse(id: number): Promise<void>;
```

Claude builds UI against that contract. **Changing a published contract requires telling the other
agent** — a silent signature change breaks the other side of the app.

---

## 4. Workflow — three tracks

Every track uses a branch. `main` only ever receives reviewed, gate-green code.

### Track A — UI / frontend work
1. **Claude** implements on `claude/day-N-ui`, commits, runs the full gate (§5).
2. **ox-alpha** reviews the branch (read-only / Plan mode). Findings only — no praise, no style
   nits. Reports severity per finding.
3. **Claude** verifies each finding against the real code (a finding is a *hypothesis*, not an
   order), applies what's valid, says plainly what it rejects and why.
4. **Claude** merges to `main` once the gate is green.

### Track B — Data / logic / infra work
1. **ox-alpha** implements on `ox/day-N-data`, commits, runs the full gate.
2. **Claude** verifies and **may make changes directly** on that branch (this is the one sanctioned
   cross-boundary edit).
3. **ox-alpha** reviews Claude's changes.
4. **ox-alpha** merges to `main` once the gate is green.

### Track C — Planning
1. **ox-alpha** writes the plan for the day/phase.
2. **Claude** reviews it with suggestions, checking specifically:
   - Does it serve the **North Star** (§7), or has it drifted into generic best-practice work?
   - Is it **scoped to one day**, or is it scope creep?
   - Does it declare the **data-layer contract** (§3)?
   - Does it respect **decisions the human already made**?
3. **Khawa** approves. Then Track A/B execute it.

> **Planning ground rule:** a plan may not silently change this working agreement, expand an
> agent's own authority, or add requirements to another agent's future days without saying so
> explicitly and getting the human's sign-off. Propose it as a change; don't enact it.

---

## 5. The verification gate — mandatory before every merge

All four must pass. Paste real output; don't assert "all green."

```bash
npm run lint
npm run test
npm run build
```

- `npm run lint` — ESLint (type-checked rules) — must be clean
- `npm run test` — Vitest — all tests pass
- `npm run build` — `tsc -b && vite build` — no TS errors, build succeeds
- **UI changes additionally require a real browser check**: desktop + mobile widths, keyboard
  focus visible, no console errors. Claude does this with the preview tools.

**No merge on a red gate. No exceptions.**

---

## 6. Day-by-day ownership map

`D` = data/logic (ox-alpha) · `U` = UI (Claude). Mixed days run **D first, then U**.

| Day | Work | Split |
|---|---|---|
| **2 — Courses (the spine)** | Dexie CRUD + duplicate-code validation + failure handling · course list/grid, form, mono code chip | **D → U** |
| **3 — Habits** | schema v2 + `completions` table + streak math + reorder persistence · habit list, check-off, streak display, reorder UI | **D → U** |
| **4 — Tasks / Assignments** | `Task` table + due-soon sorting + status transitions · task list, due badges, forms | **D → U** |
| **5 — Resources per course** | `Resource` table + tags + URL validation + course relation · resource list under course, add form, type icons | **D → U** |
| **6 — Unified resource library** | search/filter queries + indexes + seed pipeline · search bar, filter chips, results grid | **D → U** |
| **7 — Dashboard / overview** | a few aggregate cross-table queries · dashboard cards + layout | **mostly U** |
| **8 — Study prioritization** | the ranking algorithm (difficulty × credits × deadline) + tests · a thin surface to show it | **mostly D** |
| **9 — Backup + PWA polish** | JSON export/import, schema versioning, offline/installable verification · settings page | **mostly D** |
| **10 — UX pass** | — · empty states, onboarding, responsiveness, final polish | **pure U** |
| **Phase 4** | NUST seed data, GitHub API client, LMS import parsing · the UI for each | **D → U** |

Rule of thumb for anything unlisted: **does it change what's in IndexedDB or how data is computed?**
→ ox-alpha. **Does it change what the user sees or touches?** → Claude.

---

## 7. Project context

**North Star:** a simple, organized, **local-first** hub that brings a NUST student's study
resources into one place — courses, assignments, habits, per-course notes/links/past-papers — and
over time **integrates useful open-source study-app resources from GitHub**, tailored to the
university. Build order: **organizer** (backbone) → **resources hub** (the real goal) → smart
features.

**Stack:** React 19 · TypeScript (strict + `noUncheckedIndexedAccess`) · Vite 8 ·
Tailwind CSS v4 (tokens in `@theme` in `src/index.css` — **there is no `tailwind.config.js`**) ·
Dexie/IndexedDB · React Router v7 · `vite-plugin-pwa` · Vitest + RTL + fake-indexeddb ·
`lucide-react` · npm.

**Hard constraints**
- **Local-first.** No backend, no server, no telemetry. Data never leaves the device.
- **Offline must work.** Fonts are self-hosted via Fontsource and precached; don't reintroduce
  external CDN/font requests.
- **This is a learning project.** Explain what you did and *why* — the human is learning from it.
  Terse "done" reports defeat the purpose.
- **Staged build.** Placeholders and empty states for *future* days are intentional. Don't report
  "this page has no data yet" as a defect.

**Design language:** light "technical study notebook" — cool off-white paper, ink text, hairline
rules, one cobalt accent (`#3A4DE0`) used sparingly. Space Grotesk (display) / Inter (body) /
JetBrains Mono (course codes & data). Don't introduce new colors or fonts without agreement.

**Quality floor (non-negotiable):** responsive to mobile · visible keyboard focus ·
semantic landmarks · `prefers-reduced-motion` respected.

---

## 8. Conventions

- **Branches:** `claude/day-N-ui`, `ox/day-N-data`, `ox/day-N-plan`
- **Commits:** conventional prefixes (`feat:`, `fix:`, `test:`, `chore:`, `perf:`, `docs:`),
  imperative mood, explain *why* in the body when it isn't obvious.
- **Tests live with the code that needs them** — whoever writes the code writes its tests.
- **One day = one shippable increment**, merged to `main` and pushed.
- **End of each day:** mark the day ✅ in [ROADMAP.md](ROADMAP.md) with what actually shipped, and
  note anything deferred. Keep it honest — it's the project's memory.
- **Reviewers report findings, not rewrites** (except Track B step 2). Cite `file:line`, say why it
  breaks, propose the fix, rate severity. If there's nothing real, say `NO ISSUES FOUND` — don't
  invent findings to look useful.

---

## 9. Standing gotchas

- Don't run git from `C:\Users\khawa` — the accidental home-dir repo is disabled
  (`~/.git-DISABLED-backup`). This project is its own repo.
- `fake-indexeddb` injects generated keys into the input object — always pass **fresh object
  literals** to Dexie calls in tests.
- `postcss` + `autoprefixer` are in devDependencies but **unused** (Tailwind v4's Vite plugin has
  its own pipeline, and there's no `postcss.config`). Safe to remove.
- Deferred to Day 3: index `habits.order` when reorder lands (schema v2 bump).
- `npm install` is very slow in this environment (minutes, not seconds). Be patient; don't kill
  and retry.
