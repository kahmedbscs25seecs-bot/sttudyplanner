import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Textarea } from '../components/ui/Textarea';

afterEach(cleanup);

describe('Textarea', () => {
  it('associates its label with the control', () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByLabelText('Notes')).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('shows a hint and points aria-describedby at it', () => {
    render(<Textarea label="Notes" hint="Optional" />);
    const field = screen.getByLabelText('Notes');
    const hint = screen.getByText('Optional');

    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).toHaveAttribute('aria-describedby', hint.id);
  });

  it('marks the field invalid and describes it by the error instead', () => {
    render(<Textarea label="Notes" hint="Optional" error="Too long" />);
    const field = screen.getByLabelText('Notes');

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', screen.getByText('Too long').id);
    // The hint gives way to the error — never both, so the announcement on
    // focus is the thing that needs fixing.
    expect(screen.queryByText('Optional')).toBeNull();
  });
});
