import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HabitStreakBadge } from '../components/habits/HabitStreakBadge';

afterEach(cleanup);

describe('HabitStreakBadge', () => {
  it('renders nothing at zero — absence IS the zero state', () => {
    const { container } = render(<HabitStreakBadge streak={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing at negative values (defensive)', () => {
    const { container } = render(<HabitStreakBadge streak={-1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count with a self-describing accessible name at ≥1', () => {
    render(<HabitStreakBadge streak={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    // sr-only text doubles as the queryable description.
    expect(screen.getByText(/2 day streak/i)).toBeInTheDocument();
  });
});
