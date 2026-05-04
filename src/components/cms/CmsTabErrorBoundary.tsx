import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface CmsTabErrorBoundaryState {
  error: Error | null;
}

export class CmsTabErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string },
  CmsTabErrorBoundaryState
> {
  state: CmsTabErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(previousProps: { resetKey: string }) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="space-y-4 p-8">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-semibold">CMS tab failed to load</h2>
              <p className="mt-1 break-words text-sm opacity-90">
                {this.state.error.message || 'Unexpected rendering error.'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => this.setState({ error: null })}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
