import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort crash screen around the whole app. Catches unexpected render
 * errors (e.g. a corrupted IndexedDB read) so one failure never blanks out
 * the PWA — it offers recovery instead.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  /** Clear the error and re-render children (fresh mount of the subtree). */
  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint text-accent">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          An unexpected error interrupted the app. Your data stays safe on
          this device — try again, or reload if the problem persists.
        </p>
        <pre className="mt-4 max-w-md overflow-x-auto rounded-lg border border-line bg-surface px-4 py-3 text-left font-mono text-xs text-muted">
          {error.message}
        </pre>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={this.reset}>
            Try again
          </Button>
          <Button onClick={() => window.location.reload()}>
            Reload app
          </Button>
        </div>
      </div>
    );
  }
}
