import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WebShellTopBar } from "@/player/WebShellTopBar.tsx";
import { resetWebShellStateForTests } from "@/player/useWebShell.ts";

type Listener = (state: {
  open: boolean;
  appId: string | null;
  url: string | null;
  partition: string | null;
}) => void;

function installFakePreload() {
  const listeners: Listener[] = [];
  const closeWebShell = vi.fn(async () => ({ ok: true }));
  (window as unknown as { orangeTv: Record<string, unknown> }).orangeTv = {
    closeWebShell,
    openWebShell: vi.fn(),
    onWebShellState: (cb: Listener) => {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
  return {
    closeWebShell,
    push(state: Parameters<Listener>[0]) {
      for (const l of listeners) l(state);
    },
  };
}

describe("<WebShellTopBar>", () => {
  beforeEach(() => {
    resetWebShellStateForTests();
  });

  afterEach(() => {
    delete (window as unknown as { orangeTv?: unknown }).orangeTv;
    resetWebShellStateForTests();
  });

  it("renders nothing when no web shell is open", () => {
    installFakePreload();
    const { container } = render(<WebShellTopBar />);
    expect(container.firstChild).toBeNull();
  });

  it("shows a Back button and the appId label when the web shell opens", () => {
    const { push } = installFakePreload();
    const { rerender } = render(<WebShellTopBar />);
    push({
      open: true,
      appId: "netflix",
      url: "https://www.netflix.com",
      partition: "persist:netflix",
    });
    rerender(<WebShellTopBar />);
    expect(screen.getByTestId("web-shell-top-bar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to orange tv/i })).toBeInTheDocument();
    expect(screen.getByText(/netflix/i)).toBeInTheDocument();
  });

  it("invokes closeWebShell when Back is clicked", async () => {
    const user = userEvent.setup();
    const { push, closeWebShell } = installFakePreload();
    const { rerender } = render(<WebShellTopBar />);
    push({
      open: true,
      appId: "prime-video",
      url: "https://www.primevideo.com",
      partition: "persist:prime-video",
    });
    rerender(<WebShellTopBar />);
    await user.click(screen.getByRole("button", { name: /back to orange tv/i }));
    expect(closeWebShell).toHaveBeenCalledOnce();
  });

  it("falls back to a generic label when appId is null", () => {
    const { push } = installFakePreload();
    const { rerender } = render(<WebShellTopBar />);
    push({ open: true, appId: null, url: null, partition: null });
    rerender(<WebShellTopBar />);
    expect(screen.getByText(/streaming/i)).toBeInTheDocument();
  });
});
