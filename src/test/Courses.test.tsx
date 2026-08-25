import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { addCourse } from '../data/courses';
import { Courses } from '../pages/Courses';

/** RTL auto-cleanup needs `globals: true`, which this project doesn't set. */
afterEach(cleanup);

beforeEach(async () => {
  await db.courses.clear();
});

/** Scopes queries to the open dialog — jsdom doesn't make background content
 *  inert, so page and dialog controls can share accessible names. */
function inDialog() {
  return within(screen.getByRole('dialog'));
}

/** Scopes queries to the course grid. Needed for difficulty labels: a real
 *  browser hides a closed `<dialog>` via `display:none`, but jsdom doesn't, so
 *  the form's "Selected: Hard" would otherwise collide with a card's "Hard". */
function inList() {
  return within(screen.getByRole('list'));
}

async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
  render(<Courses />);
  await screen.findByRole('heading', { name: /no courses yet/i });
  await user.click(screen.getByRole('button', { name: /add your first course/i }));
  return inDialog();
}

describe('Courses page states', () => {
  it('shows a loading status before the first read resolves', () => {
    render(<Courses />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading courses/i);
    expect(screen.queryByRole('heading', { name: /no courses yet/i })).toBeNull();
  });

  it('shows the empty state once the read resolves with no courses', async () => {
    render(<Courses />);
    expect(
      await screen.findByRole('heading', { name: /no courses yet/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('lists stored courses with a count and credit-hour summary', async () => {
    await addCourse({ code: 'CS-101', name: 'Intro to Programming', creditHours: 3, difficulty: 2 });
    await addCourse({ code: 'MATH-105', name: 'Calculus I', creditHours: 4, difficulty: 4 });
    render(<Courses />);

    expect(await screen.findByText('CS-101')).toBeInTheDocument();
    expect(screen.getByText('MATH-105')).toBeInTheDocument();
    expect(screen.getByText(/2 courses · 7 credit hours/i)).toBeInTheDocument();
  });

  it('renders the difficulty as a named level', async () => {
    await addCourse({ code: 'EE-210', name: 'Circuits', creditHours: 3, difficulty: 4 });
    render(<Courses />);
    expect(await screen.findByText('Hard')).toBeInTheDocument();
  });
});

describe('adding a course', () => {
  it('stores a course and shows it in the list', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.type(dialog.getByLabelText('Course code'), 'cs-101');
    await user.type(dialog.getByLabelText('Course name'), '  Intro to Programming  ');
    await user.selectOptions(dialog.getByLabelText('Credit hours'), '4');
    await user.click(dialog.getByRole('radio', { name: '5' }));
    await user.click(dialog.getByRole('button', { name: 'Add course' }));

    // Normalized on the way in by the data layer, so the card shows CS-101.
    expect(await screen.findByText('CS-101')).toBeInTheDocument();
    expect(screen.getByText('Intro to Programming')).toBeInTheDocument();
    expect(inList().getByText('Very hard')).toBeInTheDocument();
    expect(screen.getByText(/1 course · 4 credit hours/i)).toBeInTheDocument();
  });

  it('submits on Enter from a text field', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.type(dialog.getByLabelText('Course code'), 'CS-101');
    await user.type(dialog.getByLabelText('Course name'), 'Intro to Programming{Enter}');

    expect(await screen.findByText('CS-101')).toBeInTheDocument();
  });

  it('flags the code field and stays open when the code is invalid', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.type(dialog.getByLabelText('Course code'), 'C');
    await user.type(dialog.getByLabelText('Course name'), 'Too Short A Code');
    await user.click(dialog.getByRole('button', { name: 'Add course' }));

    const codeField = dialog.getByLabelText('Course code');
    expect(codeField).toHaveAttribute('aria-invalid', 'true');
    expect(codeField).toHaveFocus();
    expect(await db.courses.count()).toBe(0);

    const message = dialog.getByText(/2–10 characters/i);
    // ValidationError.message is prefixed with the field name for logs; that
    // prefix must not reach the user, who already sees the "Course code" label.
    expect(message.textContent?.startsWith('code:')).toBe(false);
  });

  it('flags the name field when the name is blank', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.type(dialog.getByLabelText('Course code'), 'CS-101');
    await user.click(dialog.getByRole('button', { name: 'Add course' }));

    const nameField = dialog.getByLabelText('Course name');
    expect(nameField).toHaveAttribute('aria-invalid', 'true');
    expect(nameField).toHaveFocus();
    expect(await db.courses.count()).toBe(0);
  });

  it('reports a duplicate code on the code field', async () => {
    await addCourse({ code: 'CS-101', name: 'Intro to Programming', creditHours: 3, difficulty: 2 });
    const user = userEvent.setup();
    render(<Courses />);
    await screen.findByText('CS-101');
    await user.click(screen.getByRole('button', { name: /add course/i }));

    const dialog = inDialog();
    await user.type(dialog.getByLabelText('Course code'), 'cs-101');
    await user.type(dialog.getByLabelText('Course name'), 'A Different Name');
    await user.click(dialog.getByRole('button', { name: 'Add course' }));

    expect(dialog.getByLabelText('Course code')).toHaveAttribute('aria-invalid', 'true');
    expect(dialog.getByText(/already in use/i)).toBeInTheDocument();
    expect(await db.courses.count()).toBe(1);
  });

  it('does not carry a cancelled draft into the next open', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);
    await user.type(dialog.getByLabelText('Course code'), 'DRAFT-1');
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));

    await user.click(screen.getByRole('button', { name: /add course/i }));
    expect(inDialog().getByLabelText('Course code')).toHaveValue('');
  });
});

describe('editing a course', () => {
  it('pre-fills the form and saves changes', async () => {
    await addCourse({ code: 'CS-101', name: 'Intro to Programming', creditHours: 3, difficulty: 2 });
    const user = userEvent.setup();
    render(<Courses />);
    await screen.findByText('CS-101');

    await user.click(screen.getByRole('button', { name: 'Edit CS-101' }));
    const dialog = inDialog();
    expect(dialog.getByLabelText('Course code')).toHaveValue('CS-101');
    expect(dialog.getByLabelText('Course name')).toHaveValue('Intro to Programming');
    expect(dialog.getByLabelText('Credit hours')).toHaveValue('3');

    await user.clear(dialog.getByLabelText('Course name'));
    await user.type(dialog.getByLabelText('Course name'), 'Programming Fundamentals');
    await user.click(dialog.getByRole('radio', { name: '4' }));
    await user.click(dialog.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Programming Fundamentals')).toBeInTheDocument();
    expect(inList().getByText('Hard')).toBeInTheDocument();
    expect(await db.courses.count()).toBe(1);
  });

  it('lets a course keep its own code', async () => {
    await addCourse({ code: 'CS-101', name: 'Intro to Programming', creditHours: 3, difficulty: 2 });
    const user = userEvent.setup();
    render(<Courses />);
    await screen.findByText('CS-101');

    await user.click(screen.getByRole('button', { name: 'Edit CS-101' }));
    const dialog = inDialog();
    await user.clear(dialog.getByLabelText('Course name'));
    await user.type(dialog.getByLabelText('Course name'), 'Renamed Only');
    await user.click(dialog.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Renamed Only')).toBeInTheDocument();
  });
});

describe('deleting a course', () => {
  it('asks for confirmation and keeps the course when cancelled', async () => {
    await addCourse({ code: 'CS-101', name: 'Intro to Programming', creditHours: 3, difficulty: 2 });
    const user = userEvent.setup();
    render(<Courses />);
    await screen.findByText('CS-101');

    await user.click(screen.getByRole('button', { name: 'Delete CS-101' }));
    const dialog = inDialog();
    expect(dialog.getByText(/can't be undone/i)).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('CS-101')).toBeInTheDocument();
    expect(await db.courses.count()).toBe(1);
  });

  it('removes the course when confirmed', async () => {
    await addCourse({ code: 'CS-101', name: 'Intro to Programming', creditHours: 3, difficulty: 2 });
    const user = userEvent.setup();
    render(<Courses />);
    await screen.findByText('CS-101');

    await user.click(screen.getByRole('button', { name: 'Delete CS-101' }));
    await user.click(inDialog().getByRole('button', { name: 'Delete course' }));

    expect(await screen.findByRole('heading', { name: /no courses yet/i })).toBeInTheDocument();
    expect(await db.courses.count()).toBe(0);
  });
});
