import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DifficultyPicker } from '../components/courses/DifficultyPicker';

afterEach(cleanup);

/**
 * The picker's error path can't be reached through the form — difficulty is a
 * closed set of radios, so the data layer never rejects it — so these guard the
 * a11y wiring directly. Regression cover for the fix where `aria-describedby`
 * moved off the wrapping <div> (invisible to a radio's focus) onto each radio.
 */
describe('DifficultyPicker error wiring', () => {
  it('points every radio at the visible error message', () => {
    render(<DifficultyPicker value={3} onChange={() => undefined} error="Pick a difficulty" />);

    const message = screen.getByText('Pick a difficulty');
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);

    for (const radio of radios) {
      expect(radio).toHaveAttribute('aria-invalid', 'true');
      // A screen reader on this radio resolves the id to the message text.
      expect(radio).toHaveAttribute('aria-describedby', message.id);
    }
  });

  it('adds no error attributes when valid', () => {
    render(<DifficultyPicker value={3} onChange={() => undefined} />);

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toHaveAttribute('aria-invalid');
      expect(radio).not.toHaveAttribute('aria-describedby');
    }
  });
});
