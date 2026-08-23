import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        That route doesn't exist yet. Let's get you back on track.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
