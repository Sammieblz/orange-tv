import { describe, expect, it } from "vitest";

import {
  ORANGE_PLAYER_INITIAL,
  PLAYER_SEEK_STEP_SECONDS,
  orangePlayerReducer,
  type OrangePlayerState,
} from "@/player/orangePlayerReducer.ts";

const playing: OrangePlayerState = {
  ...ORANGE_PLAYER_INITIAL,
  status: "playing",
  duration: 120,
  currentTime: 30,
};

describe("orangePlayerReducer — media events", () => {
  it("load-start resets to loading", () => {
    const next = orangePlayerReducer(playing, { type: "load-start" });
    expect(next.status).toBe("loading");
    expect(next.currentTime).toBe(0);
    expect(next.duration).toBeNull();
  });

  it("loaded-metadata captures a positive duration", () => {
    const next = orangePlayerReducer(ORANGE_PLAYER_INITIAL, {
      type: "loaded-metadata",
      duration: 90,
    });
    expect(next.duration).toBe(90);
  });

  it("loaded-metadata ignores non-finite or non-positive durations", () => {
    expect(
      orangePlayerReducer(ORANGE_PLAYER_INITIAL, { type: "loaded-metadata", duration: -5 })
        .duration,
    ).toBeNull();
    expect(
      orangePlayerReducer(ORANGE_PLAYER_INITIAL, {
        type: "loaded-metadata",
        duration: Number.NaN,
      }).duration,
    ).toBeNull();
  });

  it("time-update clamps to [0, duration]", () => {
    const low = orangePlayerReducer(playing, { type: "time-update", currentTime: -5 });
    expect(low.currentTime).toBe(0);
    const high = orangePlayerReducer(playing, { type: "time-update", currentTime: 999 });
    expect(high.currentTime).toBe(120);
  });

  it("error records a reason and status", () => {
    const next = orangePlayerReducer(playing, { type: "error", reason: "decode" });
    expect(next.status).toBe("error");
    expect(next.reason).toBe("decode");
  });

  it("ended transitions to ended without clearing time", () => {
    const next = orangePlayerReducer(playing, { type: "ended" });
    expect(next.status).toBe("ended");
    expect(next.currentTime).toBe(30);
  });

  it("reset returns initial state", () => {
    const next = orangePlayerReducer(playing, { type: "reset" });
    expect(next).toEqual(ORANGE_PLAYER_INITIAL);
  });
});

describe("orangePlayerReducer — TV action mapping", () => {
  it("play-pause toggles playing/paused", () => {
    const paused = orangePlayerReducer(playing, { type: "tv-action", action: "play-pause" });
    expect(paused.status).toBe("paused");
    const playingAgain = orangePlayerReducer(paused, { type: "tv-action", action: "play-pause" });
    expect(playingAgain.status).toBe("playing");
  });

  it("confirm behaves like play-pause (single-button remote)", () => {
    const paused = orangePlayerReducer(playing, { type: "tv-action", action: "confirm" });
    expect(paused.status).toBe("paused");
  });

  it("seek-forward advances by PLAYER_SEEK_STEP_SECONDS", () => {
    const next = orangePlayerReducer(playing, {
      type: "tv-action",
      action: "seek-forward",
    });
    expect(next.currentTime).toBe(30 + PLAYER_SEEK_STEP_SECONDS);
  });

  it("seek-back clamps at 0", () => {
    const start = { ...playing, currentTime: 3 };
    const next = orangePlayerReducer(start, {
      type: "tv-action",
      action: "seek-back",
    });
    expect(next.currentTime).toBe(0);
  });

  it("seek-forward clamps at duration", () => {
    const end = { ...playing, currentTime: 118 };
    const next = orangePlayerReducer(end, { type: "tv-action", action: "seek-forward" });
    expect(next.currentTime).toBe(120);
  });

  it("back sets exitRequested (surface Back returns to launcher)", () => {
    const next = orangePlayerReducer(playing, { type: "tv-action", action: "back" });
    expect(next.exitRequested).toBe(true);
  });

  it("home also requests exit", () => {
    const next = orangePlayerReducer(playing, { type: "tv-action", action: "home" });
    expect(next.exitRequested).toBe(true);
  });

  it("ignored actions (up/down/left/right/menu) do not change state", () => {
    for (const action of ["up", "down", "left", "right", "menu"] as const) {
      const next = orangePlayerReducer(playing, { type: "tv-action", action });
      expect(next, action).toBe(playing);
    }
  });

  it("play-pause while ended restarts playback", () => {
    const ended = { ...playing, status: "ended" as const };
    const next = orangePlayerReducer(ended, { type: "tv-action", action: "play-pause" });
    expect(next.status).toBe("playing");
  });
});
