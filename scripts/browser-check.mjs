 
/**
 * Real-browser interaction gate (§5) — the part jsdom structurally cannot
 * cover: native <dialog> focus-trap/Escape/restoration, focus-visible rings,
 * compositor-dependent behavior.
 *
 * Usage:
 *   npm run preview        # in one shell (serves dist/ on :4173)
 *   npm run check:ui       # in another — runs this script against it
 *
 * BASE_URL overrides the default target. Extend `runChecks` per feature day;
 * keep assertions behavioral (role/text/focus), never class-name-based.
 * Requires a Chromium-family browser; auto-detects Edge then Chrome.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

function findBrowser() {
  const fromEnv = process.env.BROWSER_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const found = CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error('No Edge/Chrome found — set BROWSER_PATH');
  return found;
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Baseline smoke suite over currently-shipped pages. */
async function runChecks(page, BASE) {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  // Dashboard renders without IndexedDB reads.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(
    () => [...document.querySelectorAll('h1')].some((h) => /dashboard/i.test(h.textContent)),
    { timeout: 15000 },
  );
  check('dashboard renders', true);

  // Courses empty state arrives async from IndexedDB (v1→v3 migrated db).
  await page.goto(`${BASE}/courses`, { waitUntil: 'networkidle0' });
  const coursesEmpty = await page
    .waitForFunction(
      () => document.body.innerText.match(/no courses yet|courses/i),
      { timeout: 15000 },
    )
    .then(() => true)
    .catch(() => false);
  check('courses page reaches a settled state', coursesEmpty);

  // Habits page likewise.
  await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle0' });
  const habitsSettled = await page
    .waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  check('habits page reaches a settled state', habitsSettled);

  // ── Tasks flow (Day 4): add w/ course+date → complete → Done → un-complete.
  await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle0' });
  const tasksUp = await page
    .waitForFunction(
      () => /no tasks yet|add your first task|task open/i.test(document.body.innerText),
      { timeout: 15000 },
    )
    .then(() => true)
    .catch(() => false);
  check('tasks page reaches a settled state', tasksUp);

  // Add a dated, course-less task via the form.
  await page.click('::-p-text(Add your first task), ::-p-text(Add task)');
  await page.waitForSelector('dialog[open]');
  await page.keyboard.type('Browser check task');
  await clickDialogButton(page, 'Add task');
  await page.waitForFunction(() => document.body.innerText.includes('Browser check task'), {
    timeout: 10000,
  });
  check('add task form submits and lists the row', true);

  // Complete it — the row leaves its bucket and Done gains a count.
  const taskBox = await page.waitForSelector('input[type=checkbox]');
  await taskBox.click();
  await page.waitForFunction(
    () => /done\s*1/i.test(document.querySelector('summary')?.textContent ?? ''),
    { timeout: 10000 },
  );
  check('completing a task moves it into Done (count visible)', true);

  // Expand Done, un-complete — the row returns to a bucket.
  await page.click('summary');
  await page.waitForFunction(
    () => [...document.querySelectorAll('input[type=checkbox]')].some((el) => el.checked),
    { timeout: 10000 },
  );
  const checkedBox = await page.$('input[type=checkbox]:checked');
  await checkedBox.click();
  await page.waitForFunction(
    () => {
      // Success: row back in a bucket AND the Done section gone entirely
      // (its <summary> vanishes when there are no completed tasks left).
      const summaryGone = document.querySelector('summary') === null;
      return (
        document.body.innerText.includes('Browser check task') && summaryGone
      );
    },
    { timeout: 10000 },
  );
  check('un-completing returns the row to its bucket', true);

  check('zero console errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 300));
}

async function clickDialogButton(page, text) {
  await page.evaluate((label) => {
    const btn = [...document.querySelectorAll('dialog[open] button')].find(
      (b) => b.textContent.trim() === label,
    );
    if (!btn) throw new Error(`no dialog button "${label}"`);
    btn.click();
  }, text);
}

async function waitForPort(port, tries = 30) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(`http://localhost:${port}/`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

// ── Spawn `vite preview` ourselves so `check:ui` is self-contained.
// Single-string command (not args array) — avoids DEP0190 on Windows shell.
const server = spawn('npx vite preview --port 4173 --strictPort', {
  shell: process.platform === 'win32',
  stdio: 'ignore',
});

try {
  const up = await waitForPort(4173);
  if (!up) throw new Error('vite preview did not come up on :4173');

  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await runChecks(page, process.env.BASE_URL ?? 'http://localhost:4173');
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed`);
process.exit(failed.length ? 1 : 0);
