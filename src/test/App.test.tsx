import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App shell', () => {
  it('renders the dashboard at the index route', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { name: /dashboard/i }),
    ).toBeInTheDocument();
  });

  it('renders the courses empty state at /courses', () => {
    renderAt('/courses');
    expect(
      screen.getByRole('heading', { name: /no courses yet/i }),
    ).toBeInTheDocument();
  });

  it('renders the habits empty state at /habits', () => {
    renderAt('/habits');
    expect(
      screen.getByRole('heading', { name: /no habits yet/i }),
    ).toBeInTheDocument();
  });

  it('renders the tasks empty state at /tasks', () => {
    renderAt('/tasks');
    expect(
      screen.getByRole('heading', { name: /no tasks yet/i }),
    ).toBeInTheDocument();
  });

  it('renders the not-found view for unknown routes', () => {
    renderAt('/this-route-does-not-exist');
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
