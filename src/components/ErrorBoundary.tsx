import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

// Catches errors thrown while rendering anything inside it, and shows a
// friendly message instead of a blank screen. React only supports this in
// class components. It does not catch errors in event handlers or in
// requests; those are already shown by each component.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  // React calls this when a child throws. The next render shows the fallback.
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: send this to an error tracking service here, for example
    // Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
    // or Airbrake's notify(). Until then, log it so it shows in the console.
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback" role="alert">
          <h1>Something went wrong</h1>
          <p>Please reload the page. If the problem keeps happening, contact support.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
