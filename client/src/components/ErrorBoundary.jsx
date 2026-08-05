import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Something went wrong while loading this page.',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              !
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
            <p className="mt-3 text-sm text-slate-600">
              The employer dashboard could not load properly. Please try refreshing the page or returning to the login screen.
            </p>
            <p className="mt-3 break-words text-xs text-red-700">{this.state.message}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/login')}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
