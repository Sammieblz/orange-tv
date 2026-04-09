import { launchAppTileIfActivated } from "@/launchFromTileActivate.ts";
import { useFocusStore } from "@/store/focusStore.ts";
import { resetFocusStore } from "@/test/resetFocusStore.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("launchAppTileIfActivated", () => {
  beforeEach(() => {
    resetFocusStore();
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
});
