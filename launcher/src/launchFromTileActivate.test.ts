import { launchAppTileIfActivated } from "@/launchFromTileActivate.ts";
import { resetLaunchFeedbackStore, useLaunchFeedbackStore } from "@/store/launchFeedbackStore.ts";
import { useFocusStore } from "@/store/focusStore.ts";
import { resetFocusStore } from "@/test/resetFocusStore.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("launchAppTileIfActivated", () => {
  beforeEach(() => {
    resetFocusStore();
    resetLaunchFeedbackStore();
    vi.restoreAllMocks();
    delete (window as unknown as { orangeTv?: unknown }).orangeTv;
  });

  it("does nothing for non-tile context", async () => {
    const spy = vi.spyOn(useFocusStore.getState(), "requestShellFocusRestore");
    await launchAppTileIfActivated({ context: "hero", id: "launch-streaming-demo" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("does nothing for unknown tile id", async () => {
    const spy = vi.spyOn(useFocusStore.getState(), "requestShellFocusRestore");
    await launchAppTileIfActivated({ context: "tile", id: "cw-1" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("calls requestShellFocusRestore before launchRequest for launch tile", async () => {
    const order: string[] = [];
    vi.spyOn(useFocusStore.getState(), "requestShellFocusRestore").mockImplementation(() => {
      order.push("restore");
    });
    const launchRequest = vi.fn(async () => {
      order.push("launch");
      return { ok: true as const };
    });
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };

    await launchAppTileIfActivated({ context: "tile", id: "launch-streaming-demo" });

    expect(order).toEqual(["restore", "launch"]);
    expect(launchRequest).toHaveBeenCalledWith({ kind: "app", id: "launch-streaming-demo" });
  });

  it("invokes onLaunchSucceeded after ok launch", async () => {
    const onLaunchSucceeded = vi.fn();
    const launchRequest = vi.fn(async () => ({ ok: true as const }));
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };
    vi.spyOn(useFocusStore.getState(), "requestShellFocusRestore").mockImplementation(() => {});

    await launchAppTileIfActivated({ context: "tile", id: "launch-streaming-demo" }, { onLaunchSucceeded });

    expect(onLaunchSucceeded).toHaveBeenCalledOnce();
  });

  it("records launch failure in feedback store when IPC returns ok false", async () => {
    const launchRequest = vi.fn(async () => ({ ok: false as const, reason: "app-not-found" }));
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };
    vi.spyOn(useFocusStore.getState(), "requestShellFocusRestore").mockImplementation(() => {});

    await launchAppTileIfActivated({ context: "tile", id: "launch-streaming-demo" });

    expect(useLaunchFeedbackStore.getState().variant).toBe("error");
    expect(useLaunchFeedbackStore.getState().line).toContain("app-not-found");
  });

  it("clears the stale focus checkpoint when the IPC launch returns ok false (SAM-59)", async () => {
    const launchRequest = vi.fn(async () => ({ ok: false as const, reason: "chrome-not-found" }));
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };

    await launchAppTileIfActivated({ context: "tile", id: "launch-streaming-demo" });

    const state = useFocusStore.getState();
    expect(state.focusCheckpoint).toBeNull();
    expect(state.shellRestorePending).toBe(false);
  });

  it("clears the stale focus checkpoint when the IPC launch throws (SAM-59)", async () => {
    const launchRequest = vi.fn(async () => {
      throw new Error("bridge-crashed");
    });
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };

    await launchAppTileIfActivated({ context: "tile", id: "launch-streaming-demo" });

    const state = useFocusStore.getState();
    expect(state.focusCheckpoint).toBeNull();
    expect(state.shellRestorePending).toBe(false);
    expect(useLaunchFeedbackStore.getState().variant).toBe("error");
  });

  it("does NOT clear the focus checkpoint on successful launch (shell-return still armed)", async () => {
    const launchRequest = vi.fn(async () => ({ ok: true as const, sessionId: "abc", pid: 42 }));
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };
    const clearSpy = vi.spyOn(useFocusStore.getState(), "clearFocusCheckpoint");

    await launchAppTileIfActivated({ context: "tile", id: "launch-streaming-demo" });

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("SAM-64: routes chrome-type streaming tiles through openWebShell when the flag is on and the bridge is present", async () => {
    const launchRequest = vi.fn(async () => ({ ok: true as const }));
    const openWebShell = vi.fn(async () => ({ ok: true as const, appId: "netflix" }));
    (window as unknown as { orangeTv: Record<string, unknown> }).orangeTv = {
      launchRequest,
      openWebShell,
    };
    const onLaunchSucceeded = vi.fn();

    await launchAppTileIfActivated(
      { context: "tile", id: "app:netflix" },
      {
        webShellEnabled: true,
        resolveApp: (id) =>
          id === "netflix"
            ? {
                id: "netflix",
                type: "chrome",
                launchUrl: "https://www.netflix.com/browse",
                chromeProfileSegment: null,
              }
            : null,
        onLaunchSucceeded,
      },
    );

    expect(openWebShell).toHaveBeenCalledWith({
      url: "https://www.netflix.com/browse",
      appId: "netflix",
      chromeProfileSegment: null,
    });
    expect(launchRequest).not.toHaveBeenCalled();
    expect(onLaunchSucceeded).toHaveBeenCalledOnce();
  });

  it("SAM-64: falls back to the external launch path when openWebShell returns ok:false", async () => {
    const launchRequest = vi.fn(async () => ({ ok: true as const }));
    const openWebShell = vi.fn(async () => ({ ok: false as const, reason: "web-shell-disabled" }));
    (window as unknown as { orangeTv: Record<string, unknown> }).orangeTv = {
      launchRequest,
      openWebShell,
    };

    await launchAppTileIfActivated(
      { context: "tile", id: "app:netflix" },
      {
        webShellEnabled: true,
        resolveApp: () => ({
          id: "netflix",
          type: "chrome",
          launchUrl: "https://www.netflix.com",
          chromeProfileSegment: null,
        }),
      },
    );

    expect(openWebShell).toHaveBeenCalledOnce();
    expect(launchRequest).toHaveBeenCalledWith({ kind: "app", id: "netflix" });
  });

  it("SAM-64: keeps the legacy external path when webShellEnabled is false", async () => {
    const launchRequest = vi.fn(async () => ({ ok: true as const }));
    const openWebShell = vi.fn();
    (window as unknown as { orangeTv: Record<string, unknown> }).orangeTv = {
      launchRequest,
      openWebShell,
    };

    await launchAppTileIfActivated(
      { context: "tile", id: "app:netflix" },
      {
        webShellEnabled: false,
        resolveApp: () => ({
          id: "netflix",
          type: "chrome",
          launchUrl: "https://www.netflix.com",
          chromeProfileSegment: null,
        }),
      },
    );

    expect(openWebShell).not.toHaveBeenCalled();
    expect(launchRequest).toHaveBeenCalledWith({ kind: "app", id: "netflix" });
  });

  it("launches app-prefixed tiles", async () => {
    const launchRequest = vi.fn(async () => ({ ok: true as const }));
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };
    vi.spyOn(useFocusStore.getState(), "requestShellFocusRestore").mockImplementation(() => {});

    await launchAppTileIfActivated({ context: "tile", id: "app:launch-streaming-demo" });

    expect(launchRequest).toHaveBeenCalledWith({
      kind: "app",
      id: "launch-streaming-demo",
    });
  });

  it("launches media tiles with kind media", async () => {
    const launchRequest = vi.fn(async () => ({ ok: true as const }));
    (window as unknown as { orangeTv: { launchRequest: typeof launchRequest } }).orangeTv = {
      launchRequest,
    };
    vi.spyOn(useFocusStore.getState(), "requestShellFocusRestore").mockImplementation(() => {});

    await launchAppTileIfActivated({
      context: "tile",
      id: "media:550e8400-e29b-41d4-a716-446655440000",
    });

    expect(launchRequest).toHaveBeenCalledWith({
      kind: "media",
      mediaItemId: "550e8400-e29b-41d4-a716-446655440000",
    });
  });
});
