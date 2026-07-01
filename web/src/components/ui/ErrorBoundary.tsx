import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  name: string;

  constructor(props: Props & { name?: string }) {
    super(props);
    this.name = props.name ?? "";
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[100px] items-center justify-center p-4">
          <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center">
            <p className="text-sm font-bold" style={{ color: "#ef4444" }}>
              {this.name ? `${this.name} 渲染失败` : "组件渲染错误"}
            </p>
            <p className="mt-2 text-xs break-all" style={{ color: "var(--text-secondary)" }}>
              {this.state.error?.message}
            </p>
            {this.state.error?.stack && (
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/20 p-2 text-left text-[10px]" style={{ color: "var(--text-muted)" }}>
                {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
