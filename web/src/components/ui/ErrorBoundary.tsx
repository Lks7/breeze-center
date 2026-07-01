import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[100px] items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              组件渲染错误
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {this.state.error?.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
