import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrangePlayer } from "@/player/OrangePlayer.tsx";

// jsdom does not implement HTMLMediaElement.play/pause; stub them so React's video element
// does not throw when autoPlay is applied.
beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("<OrangePlayer>", () => {
  it("renders a video region with aria label", () => {
    render(<OrangePlayer src="/sample.mp4" title="Sample" />);
    expect(screen.getByRole("region", { name: "Sample" })).toBeInTheDocument();
  });

  it("exposes current status via test hook", () => {
    render(<OrangePlayer src="/sample.mp4" title="Sample" initialState={{ status: "paused" }} />);
    expect(screen.getByTestId("player-status").textContent).toContain("paused");
  });

  it("captures Escape as back and calls onExit", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<OrangePlayer src="/sample.mp4" title="Sample" onExit={onExit} />);
    const region = screen.getByRole("region", { name: "Sample" });
    region.focus();
    await user.keyboard("{Escape}");
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("does not call onExit on arrow keys (they are ignored on the player surface tabbing around)", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<OrangePlayer src="/sample.mp4" title="Sample" onExit={onExit} />);
    const region = screen.getByRole("region", { name: "Sample" });
    region.focus();
    await user.keyboard("{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}");
    expect(onExit).not.toHaveBeenCalled();
  });

  it("ignores modified key combinations (Ctrl+Escape, Alt+Enter) so OS shortcuts still work", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<OrangePlayer src="/sample.mp4" title="Sample" onExit={onExit} />);
    const region = screen.getByRole("region", { name: "Sample" });
    region.focus();
    await user.keyboard("{Control>}{Escape}{/Control}");
    expect(onExit).not.toHaveBeenCalled();
  });
});
