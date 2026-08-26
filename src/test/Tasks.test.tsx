import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { addCourse } from '../data/courses';
import { addDaysISO } from '../lib/dueDates';
import { localDateISO } from '../lib/streaks';
import { Tasks } from '../pages/Tasks';

afterEach(cleanup);

// Derived, never hardcoded — frozen literals go stale at midnight.
const TODAY = localDateISO();
const TOMORROW_ISO = addDaysISO(TODAY, 1);
const LAST_WEEK = addDaysISO(TODAY, -7);

beforeEach(async () => {
  await Promise.all([db.courses.clear(), db.tasks.clear()]);
});

function inDialog() {
  return within(screen.getByRole('dialog'));
}

describe('Tasks page states', () => {
  it('shows a loading status before the first read resolves', () => {
    render(<Tasks />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading tasks/i);
    expect(screen.queryByRole('heading', { name: /no tasks yet/i })).toBeNull();
  });

  it('shows the empty state once the read resolves with no tasks', async () => {
    render(<Tasks />);
    expect(
      await screen.findByRole('heading', { name: /no tasks yet/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders grouped sections with overdue, today and undated tasks all visible', async () => {
    const courseId = await addCourse({
      code: 'CS-101',
      name: 'Intro to Programming',
      creditHours: 3,
      difficulty: 2,
    });
    // Overdue + assigned / today / undated + unassigned — one of each trap.
    await db.tasks.bulkAdd([
      { title: 'Overdue assignment', status: 'todo', courseId, dueDate: LAST_WEEK },
      { title: "Today's reading", status: 'todo', dueDate: TODAY },
      { title: 'Bare task', status: 'todo' },
    ]);
    render(<Tasks />);

    expect(await screen.findByText('Overdue assignment')).toBeInTheDocument();
    expect(screen.getByText("Today's reading")).toBeInTheDocument();
    expect(screen.getByText('Bare task')).toBeInTheDocument();

    // Section headings exist; overdue carries danger emphasis via its class.
    // Row titles are h3s inside the same regions, so anchor on the
    // "Label <count>" shape only the section heading produces.
    const overdueRegion = screen.getByRole('region', { name: 'Overdue' });
    // The count span abuts the label with no whitespace, so the accessible
    // name is "Overdue1" — allow an optional separator before the count.
    const overdueHeading = within(overdueRegion).getByRole('heading', {
      name: /^overdue\s*\d+$/i,
    });
    expect(overdueHeading.className).toContain('text-danger');
    expect(
      within(screen.getByRole('region', { name: 'Today' })).getByRole('heading', {
        name: /^today\s*\d+$/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'No date' })).getByRole('heading', {
        name: /^no date\s*\d+$/i,
      }),
    ).toBeInTheDocument();
    // selector 'span': the mounted form dialog's hidden <option> also says CS-101.
    expect(await screen.findByText('CS-101', { selector: 'span' })).toBeInTheDocument(); // course chip
  });

  it('shows the open/done subtitle', async () => {
    await db.tasks.bulkAdd([
      { title: 'Open one', status: 'todo' },
      { title: 'Finished one', status: 'done', completedAt: TODAY },
    ]);
    render(<Tasks />);
    expect(await screen.findByText(/1 task open · 1 done/i)).toBeInTheDocument();
  });
});

describe('adding a task', () => {
  async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
    render(<Tasks />);
    await screen.findByRole('heading', { name: /no tasks yet/i });
    await user.click(screen.getByRole('button', { name: /add your first task/i }));
    return inDialog();
  }

  it('stores a task with course + date + notes', async () => {
    const courseId = await addCourse({
      code: 'CS-101',
      name: 'Intro to Programming',
      creditHours: 3,
      difficulty: 2,
    });
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.type(dialog.getByLabelText('Title'), 'Assignment 1');
    await user.selectOptions(dialog.getByLabelText('Course'), String(courseId));
    await user.type(dialog.getByLabelText('Due date'), TOMORROW_ISO);
    await user.type(dialog.getByLabelText('Notes'), 'chapters 3-5');
    await user.click(dialog.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Assignment 1')).toBeInTheDocument();
    const all = await db.tasks.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ title: 'Assignment 1', courseId, dueDate: TOMORROW_ISO, notes: 'chapters 3-5', status: 'todo' });
  });

  it('stores a task with neither course nor date nor notes — not rejected', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    // Everything except title left empty: addTask must OMIT the keys.
    await user.type(dialog.getByLabelText('Title'), 'Bare task');
    await user.click(dialog.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Bare task')).toBeInTheDocument();
    const all = await db.tasks.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).not.toHaveProperty('courseId');
    expect(all[0]).not.toHaveProperty('dueDate');
    expect(all[0]).not.toHaveProperty('notes');
  });

  it('flags the title field and stays open when the title is blank', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.click(dialog.getByRole('button', { name: 'Add task' }));

    const titleField = dialog.getByLabelText('Title');
    expect(titleField).toHaveAttribute('aria-invalid', 'true');
    expect(titleField).toHaveFocus();
    expect(await db.tasks.count()).toBe(0);
  });

  it('does not carry a cancelled draft into the next open', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);
    await user.type(dialog.getByLabelText('Title'), 'DRAFT');
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));

    await user.click(screen.getByRole('button', { name: /add task/i }));
    expect(inDialog().getByLabelText('Title')).toHaveValue('');
  });
});

describe('editing a task', () => {
  async function seedAndOpenEdit(user: ReturnType<typeof userEvent.setup>) {
    const courseId = await addCourse({
      code: 'CS-101',
      name: 'Intro to Programming',
      creditHours: 3,
      difficulty: 2,
    });
    await db.tasks.bulkAdd([
      { title: 'Assignment 1', status: 'todo', courseId, dueDate: TODAY, notes: 'old' },
    ]);
    render(<Tasks />);
    await screen.findByText('Assignment 1');
    await user.click(screen.getByRole('button', { name: /edit "assignment 1"/i }));
    return { dialog: inDialog(), courseId };
  }

  it('pre-fills every field and saves changes', async () => {
    const user = userEvent.setup();
    const { dialog } = await seedAndOpenEdit(user);

    expect(dialog.getByLabelText('Title')).toHaveValue('Assignment 1');
    const courseSelect = dialog.getByLabelText('Course');
    expect(courseSelect).toHaveValue(String((await db.courses.toArray())[0]?.id));
    expect(dialog.getByLabelText('Due date')).toHaveValue(TODAY);
    expect(dialog.getByLabelText('Notes')).toHaveValue('old');

    await user.clear(dialog.getByLabelText('Title'));
    await user.type(dialog.getByLabelText('Title'), 'Renamed');
    await user.click(dialog.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Renamed')).toBeInTheDocument();
  });

  it('clears the due date — row moves to No date', async () => {
    const user = userEvent.setup();
    const { dialog } = await seedAndOpenEdit(user);

    await user.clear(dialog.getByLabelText('Due date'));
    await user.click(dialog.getByRole('button', { name: 'Save changes' }));

    // The stored key is REMOVED (null sentinel), and the row re-buckets.
    await waitFor(async () => {
      const stored = (await db.tasks.toArray())[0];
      expect(stored).not.toHaveProperty('dueDate');
    });
    expect(await screen.findByText(/no date/i)).toBeInTheDocument();
  });

  it('clears the course assignment — chip disappears', async () => {
    const user = userEvent.setup();
    const { dialog } = await seedAndOpenEdit(user);

    await user.selectOptions(dialog.getByLabelText('Course'), '');
    await user.click(dialog.getByRole('button', { name: 'Save changes' }));

    // jsdom keeps closed <dialog>s queryable (no UA stylesheets) — assert the
    // reflected `open` attribute instead of role presence.
    await waitFor(() => {
      const dialogs = [...document.querySelectorAll('dialog')];
      expect(dialogs.length).toBeGreaterThan(0);
      expect(dialogs.every((d) => !d.open)).toBe(true);
    });
    await waitFor(async () => {
      const stored = (await db.tasks.toArray())[0];
      expect(stored).not.toHaveProperty('courseId');
    });
    // The closed-but-mounted form dialog keeps its <option>CS-101</option> in
    // the DOM (jsdom applies no UA styles) — assert the chip span specifically.
    expect(screen.queryByText('CS-101', { selector: 'span' })).toBeNull();
  });
});

describe('deleting a task', () => {
  it('removes the task after confirmation', async () => {
    await db.tasks.bulkAdd([{ title: 'Assignment 1', status: 'todo' }]);
    const user = userEvent.setup();
    render(<Tasks />);
    await screen.findByText('Assignment 1');

    await user.click(screen.getByRole('button', { name: /delete "assignment 1"/i }));
    await user.click(inDialog().getByRole('button', { name: 'Delete task' }));

    expect(
      await screen.findByRole('heading', { name: /no tasks yet/i }),
    ).toBeInTheDocument();
    expect(await db.tasks.count()).toBe(0);
  });
});

describe('completion lifecycle', () => {
  it('moves a completed task into Done and stamps completedAt', async () => {
    await db.tasks.bulkAdd([
      { title: 'Assignment 1', status: 'todo', dueDate: TODAY },
    ]);
    const user = userEvent.setup();
    render(<Tasks />);
    await screen.findByText('Assignment 1');

    await user.click(screen.getByRole('checkbox', { name: /mark "assignment 1" done/i }));

    // Authoritative state first; the Done disclosure then shows count 1.
    await waitFor(async () => {
      const stored = (await db.tasks.toArray())[0];
      expect(stored?.status).toBe('done');
      expect(stored?.completedAt).toBe(TODAY);
    });
    const doneHeading = await screen.findByRole('heading', { name: /^done/i });
    expect(doneHeading).toBeInTheDocument();

    // jsdom toggles <details> only when the summary itself is the click target.
    const summary = doneHeading.closest('summary');
    expect(summary).not.toBeNull();
    await user.click(summary!);
    const checkbox = await screen.findByRole('checkbox', {
      name: /mark "assignment 1" done/i,
    });
    expect(checkbox).toBeChecked();
  });

  it('starts collapsed and un-completing returns the task to its bucket', async () => {
    await db.tasks.bulkAdd([
      { title: 'Finished one', status: 'done', completedAt: TODAY },
    ]);
    const user = userEvent.setup();
    render(<Tasks />);
    const doneHeading = await screen.findByRole('heading', { name: /done/i });

    // Collapsed by default: expanding reveals the checked row.
    const summary = doneHeading.closest('summary');
    await user.click(summary!);

    const checkbox = await screen.findByRole('checkbox', {
      name: /mark "finished one" done/i,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox); // un-complete → absolute state 'todo'

    await waitFor(() => {
      return Promise.all([db.tasks.toArray()]).then(([all]) => {
        const stored = all[0];
        expect(stored?.status).toBe('todo');
        expect(stored).not.toHaveProperty('completedAt');
      });
    });
    expect(await screen.findByText('Finished one')).toBeInTheDocument();
  });
});
