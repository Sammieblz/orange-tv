import { describe, expect, it } from "vitest";

import {
  KEY_TO_ACTION,
  TV_CONTROLS_CONTRACT,
  backDestination,
  listContractedSurfaces,
  shouldCaptureAction,
  type TvAction,
  type TvSurface,
} from "@/navigation/tvControlsContract.ts";

const ALL_SURFACES: TvSurface[] = ["launcher", "player", "web-shell"];
const ALL_ACTIONS: TvAction[] = [
  "up",
  "down",
  "left",
  "right",
  "confirm",
  "back",
  "play-pause",
  "seek-forward",
  "seek-back",
  "home",
  "menu",
];

describe("TV_CONTROLS_CONTRACT", () => {
  it("declares every surface", () => {
    expect(listContractedSurfaces()).toEqual(ALL_SURFACES);
  });

  it("declares every logical action on every surface (no gaps)", () => {
    for (const surface of ALL_SURFACES) {
      const handlings = TV_CONTROLS_CONTRACT[surface].actions;
      for (const action of ALL_ACTIONS) {
        expect(handlings[action], `${surface}:${action}`).toMatch(
          /^(shell|delegated|ignored)$/,
        );
      }
    }
  });

  it("launcher ignores playback actions (no <video> on the home grid)", () => {
    const launcher = TV_CONTROLS_CONTRACT.launcher.actions;
    expect(launcher["play-pause"]).toBe("ignored");
    expect(launcher["seek-forward"]).toBe("ignored");
    expect(launcher["seek-back"]).toBe("ignored");
  });

  it("player handles every navigation + playback action directly", () => {
    const player = TV_CONTROLS_CONTRACT.player.actions;
    for (const a of ALL_ACTIONS) {
      expect(player[a], `player:${a}`).toBe("shell");
    }
  });

  it("web-shell delegates navigation/playback to the page but captures back + home", () => {
    const web = TV_CONTROLS_CONTRACT["web-shell"].actions;
    expect(web.back).toBe("shell");
    expect(web.home).toBe("shell");
    expect(web.menu).toBe("shell");
    expect(web.up).toBe("delegated");
    expect(web["play-pause"]).toBe("delegated");
  });
});

describe("backDestination", () => {
  it("launcher back returns to sidebar", () => {
    expect(backDestination("launcher")).toBe("sidebar");
  });

  it("player and web-shell back return to launcher", () => {
    expect(backDestination("player")).toBe("launcher");
    expect(backDestination("web-shell")).toBe("launcher");
  });
});

describe("shouldCaptureAction", () => {
  it("returns true only for shell-handled actions", () => {
    expect(shouldCaptureAction("launcher", "up")).toBe(true);
    expect(shouldCaptureAction("launcher", "play-pause")).toBe(false);
    expect(shouldCaptureAction("web-shell", "up")).toBe(false);
    expect(shouldCaptureAction("web-shell", "back")).toBe(true);
  });
});

describe("KEY_TO_ACTION", () => {
  it("maps TV navigation keys", () => {
    expect(KEY_TO_ACTION.ArrowUp).toBe("up");
    expect(KEY_TO_ACTION.ArrowDown).toBe("down");
    expect(KEY_TO_ACTION.ArrowLeft).toBe("left");
    expect(KEY_TO_ACTION.ArrowRight).toBe("right");
  });

  it("maps Enter/Escape to confirm/back (shared with launcher key map)", () => {
    expect(KEY_TO_ACTION.Enter).toBe("confirm");
    expect(KEY_TO_ACTION.Escape).toBe("back");
  });

  it("maps YouTube-style playback shortcuts", () => {
    expect(KEY_TO_ACTION[" "]).toBe("play-pause");
    expect(KEY_TO_ACTION.k).toBe("play-pause");
    expect(KEY_TO_ACTION.l).toBe("seek-forward");
    expect(KEY_TO_ACTION.j).toBe("seek-back");
  });

  it("ignores unmapped keys", () => {
    expect(KEY_TO_ACTION.z).toBeUndefined();
  });
});
