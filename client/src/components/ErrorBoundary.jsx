import { Component } from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || '',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error boundary caught an error:', error, errorInfo);
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              !
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{t('common.errorBoundaryTitle', { defaultValue: 'Something went wrong' })}</h2>
            <p className="mt-3 text-sm text-slate-600">
              {t('common.errorBoundaryMessage', { defaultValue: 'The employer dashboard could not load properly. Please try refreshing the page or returning to the login screen.' })}
            </p>
            <p className="mt-3 break-words text-xs text-red-700">{this.state.message || t('common.errorBoundaryFallback', { defaultValue: 'Something went wrong while loading this page.' })}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D5BC4]"
              >
                {t('common.reload', { defaultValue: 'Reload' })}
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/login')}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t('common.goToLogin', { defaultValue: 'Go to Login' })}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);