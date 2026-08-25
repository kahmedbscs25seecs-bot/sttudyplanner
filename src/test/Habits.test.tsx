import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { addHabit, setCompleted } from '../data/habits';
import { currentStreak, localDateISO, previousDayISO } from '../lib/streaks';
import { Habits } from '../pages/Habits';

afterEach(cleanup);

beforeEach(async () => {
  await Promise.all([db.habits.clear(), db.completions.clear()]);
});

/** Scopes queries to the open dialog — jsdom doesn't make background content
 *  inert, so page and dialog controls can share accessible names. */
function inDialog() {
  return within(screen.getByRole('dialog'));
}

function inList() {
  return within(screen.getByRole('list'));
}

async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
  render(<Habits />);
  await screen.findByRole('heading', { name: /no habits yet/i });
  await user.click(screen.getByRole('button', { name: /add your first habit/i }));
  return inDialog();
}

describe('Habits page states', () => {
  it('shows a loading status before the first read resolves', () => {
    render(<Habits />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading habits/i);
    expect(screen.queryByRole('heading', { name: /no habits yet/i })).toBeNull();
  });

  it('shows the empty state once the read resolves with no habits', async () => {
    render(<Habits />);
    expect(
      await screen.findByRole('heading', { name: /no habits yet/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('lists stored habits with a count and done-today subtitle', async () => {
    const a = await addHabit({ title: 'Morning revision' });
    await addHabit({ title: 'Read 20 pages' });
    await setCompleted(a, localDateISO(), true);
    render(<Habits />);

    expect(await screen.findByText('Morning revision')).toBeInTheDocument();
    expect(screen.getByText('Read 20 pages')).toBeInTheDocument();
    expect(screen.getByText(/2 habits · 1 done today/i)).toBeInTheDocument();
  });
});

describe('adding a habit', () => {
  it('stores a habit and shows it in the list', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.type(dialog.getByLabelText('Title'), '  Morning revision  ');
    await user.click(dialog.getByRole('button', { name: 'Add habit' }));

    // Trimmed by the data layer on the way in.
    expect(await screen.findByText('Morning revision')).toBeInTheDocument();
    expect(await db.habits.count()).toBe(1);
  });

  it('submits on Enter from the title field', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.type(dialog.getByLabelText('Title'), 'Morning revision{Enter}');

    expect(await screen.findByText('Morning revision')).toBeInTheDocument();
  });

  it('flags the title field and stays open when the title is blank', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);

    await user.click(dialog.getByRole('button', { name: 'Add habit' }));

    const titleField = dialog.getByLabelText('Title');
    expect(titleField).toHaveAttribute('aria-invalid', 'true');
    expect(titleField).toHaveFocus();
    expect(await db.habits.count()).toBe(0);
  });

  it('does not carry a cancelled draft into the next open', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);
    await user.type(dialog.getByLabelText('Title'), 'DRAFT');
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));

    await user.click(screen.getByRole('button', { name: /add habit/i }));
    expect(inDialog().getByLabelText('Title')).toHaveValue('');
  });
});

describe('editing a habit', () => {
  it('pre-fills the form and saves changes', async () => {
    await addHabit({ title: 'Morning revision' });
    const user = userEvent.setup();
    render(<Habits />);
    await screen.findByText('Morning revision');

    await user.click(screen.getByRole('button', { name: /edit "morning revision"/i }));
    const dialog = inDialog();
    expect(dialog.getByLabelText('Title')).toHaveValue('Morning revision');

    await user.clear(dialog.getByLabelText('Title'));
    await user.type(dialog.getByLabelText('Title'), 'Evening revision');
    await user.click(dialog.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Evening revision')).toBeInTheDocument();
    expect(await db.habits.count()).toBe(1);
  });
});

describe('deleting a habit', () => {
  it('warns about the cascade, keeps the habit when cancelled', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    await setCompleted(id, localDateISO(), true);
    const user = userEvent.setup();
    render(<Habits />);
    await screen.findByText('Morning revision');

    await user.click(screen.getByRole('button', { name: /delete "morning revision"/i }));
    const dialog = inDialog();
    // The confirm copy names the cascade explicitly.
    expect(dialog.getByText(/check-off history will be removed/i)).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Morning revision')).toBeInTheDocument();
    expect(await db.completions.count()).toBe(1);
  });

  it('removes the habit AND its check-off history when confirmed', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    await setCompleted(id, localDateISO(), true);
    await setCompleted(id, '2026-01-06', true);
    const user = userEvent.setup();
    render(<Habits />);
    await screen.findByText('Morning revision');

    await user.click(screen.getByRole('button', { name: /delete "morning revision"/i }));
    await user.click(inDialog().getByRole('button', { name: 'Delete habit' }));

    expect(
      await screen.findByRole('heading', { name: /no habits yet/i }),
    ).toBeInTheDocument();
    expect(await db.habits.count()).toBe(0);
    // Cascade proof: the history rows went with the habit.
    expect(await db.completions.count()).toBe(0);
  });
});

describe('daily check-off', () => {
  it('checks off today and persists one [habitId, today] row', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    const today = localDateISO();
    const user = userEvent.setup();
    render(<Habits />);
    await screen.findByText('Morning revision');

    const box = screen.getByRole('checkbox', { name: /mark "morning revision" done for today/i });
    expect(box).not.toBeChecked();

    await user.click(box);

    expect(
      await screen.findByRole('checkbox', { name: /mark "morning revision" done for today/i }),
    ).toBeChecked();
    expect(await db.completions.count()).toBe(1);
    expect((await db.completions.get([id, today]))).toMatchObject({ habitId: id, date: today });
  });

  it('clears the check-off on re-click', async () => {
    await addHabit({ title: 'Morning revision' });
    const user = userEvent.setup();
    render(<Habits />);
    await screen.findByText('Morning revision');

    const name = /mark "morning revision" done for today/i;
    await user.click(screen.getByRole('checkbox', { name }));
    await user.click(await screen.findByRole('checkbox', { name }));

    await waitFor(() => expect(screen.getByRole('checkbox', { name })).not.toBeChecked());
    expect(await db.completions.count()).toBe(0);
  });

  it('drives the streak badge from real data', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    const today = localDateISO();
    await setCompleted(id, today, true);
    await setCompleted(id, previousDayISO(today), true);
    render(<Habits />);

    expect(await screen.findByText(/2 day streak/i)).toBeInTheDocument();

    // Sanity: the shared helper agrees with what the badge claims.
    expect(currentStreak([today, previousDayISO(today)], today)).toBe(2);
  });

  it('shows no streak badge at zero', async () => {
    await addHabit({ title: 'Morning revision' });
    render(<Habits />);
    await screen.findByText('Morning revision');
    expect(screen.queryByText(/day streak/i)).toBeNull();
  });
});

describe('manual reorder', () => {
  it('disables move buttons at the ends of the list', async () => {
    await addHabit({ title: 'A' });
    await addHabit({ title: 'B' });
    await addHabit({ title: 'C' });
    render(<Habits />);
    await screen.findByText('A');

    expect(screen.getByRole('button', { name: 'Move "A" up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move "C" down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move "A" down' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move "C" up' })).toBeEnabled();
  });

  it('swaps adjacent rows and persists the new order', async () => {
    await addHabit({ title: 'A' });
    await addHabit({ title: 'B' });
    await addHabit({ title: 'C' });
    const user = userEvent.setup();
    render(<Habits />);
    await screen.findByText('A');

    await user.click(screen.getByRole('button', { name: 'Move "A" down' }));

    // DOM order follows `order`, so headings are the source of truth.
    await waitFor(() => {
      const titles = inList()
        .getAllByRole('heading')
        .map((h) => h.textContent);
      expect(titles).toEqual(['B', 'A', 'C']);
    });

    const persisted = await db.habits.orderBy('order').toArray();
    expect(persisted.map((h) => h.title)).toEqual(['B', 'A', 'C']);
  });
});
