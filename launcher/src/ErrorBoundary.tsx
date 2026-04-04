import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Launcher render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "2rem",
            background: "#0a0a0a",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginTop: 0 }}>Launcher failed to render</h1>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ff6b00" }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
