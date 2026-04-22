/**
 * Orange Player — pure state machine for the in-shell HTML5 `<video>` spike (SAM-56).
 *
 * Kept separate from the React component so the state transitions (and the mapping
 * from the TV controls contract to player actions) are unit-testable without jsdom
 * video element quirks.
 *
 * See `docs/player-and-streaming-strategy.md` → "Orange Player".
 */

import type { TvAction } from "@/navigation/tvControlsContract.ts";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export interface OrangePlayerState {
  status: PlayerStatus;
  /** Current playback position in seconds (clamped >= 0). */
  currentTime: number;
  /** Duration in seconds, or `null` while unknown (pre-metadata). */
  duration: number | null;
  /** `true` once the user explicitly requested a back / exit. */
  exitRequested: boolean;
  /** Last non-fatal reason (e.g. seek clamped, playback error). */
  reason: string | null;
}

export const ORANGE_PLAYER_INITIAL: OrangePlayerState = Object.freeze({
  status: "idle",
  currentTime: 0,
  duration: null,
  exitRequested: false,
  reason: null,
});

/** How far a single seek action jumps (in seconds). */
export const PLAYER_SEEK_STEP_SECONDS = 10;

export type OrangePlayerEvent =
  | { type: "load-start" }
  | { type: "loaded-metadata"; duration: number }
  | { type: "play" }
  | { type: "pause" }
  | { type: "time-update"; currentTime: number }
  | { type: "ended" }
  | { type: "error"; reason: string }
  | { type: "tv-action"; action: TvAction }
  | { type: "reset" };

function clampTime(t: number, duration: number | null): number {
  if (!Number.isFinite(t) || t < 0) return 0;
  if (duration !== null && Number.isFinite(duration) && t > duration) return duration;
  return t;
}

function applyTvAction(
  state: OrangePlayerState,
  action: TvAction,
): OrangePlayerState {
  switch (action) {
    case "play-pause": {
      if (state.status === "playing") return { ...state, status: "paused", reason: null };
      if (state.status === "paused" || state.status === "ended") {
        return { ...state, status: "playing", reason: null };
      }
      return state;
    }
    case "seek-forward":
      return {
        ...state,
        currentTime: clampTime(state.currentTime + PLAYER_SEEK_STEP_SECONDS, state.duration),
        reason: null,
      };
    case "seek-back":
      return {
        ...state,
        currentTime: clampTime(state.currentTime - PLAYER_SEEK_STEP_SECONDS, state.duration),
        reason: null,
      };
    case "confirm":
      if (state.status === "playing") return { ...state, status: "paused", reason: null };
      if (state.status === "paused" || state.status === "ended") {
        return { ...state, status: "playing", reason: null };
      }
      return state;
    case "back":
    case "home":
      return { ...state, exitRequested: true };
    default:
      return state;
  }
}

export function orangePlayerReducer(
  state: OrangePlayerState,
  event: OrangePlayerEvent,
): OrangePlayerState {
  switch (event.type) {
    case "load-start":
      return { ...ORANGE_PLAYER_INITIAL, status: "loading" };
    case "loaded-metadata":
      return {
        ...state,
        duration: Number.isFinite(event.duration) && event.duration > 0 ? event.duration : null,
      };
    case "play":
      return { ...state, status: "playing", reason: null };
    case "pause":
      return { ...state, status: "paused", reason: null };
    case "time-update":
      return { ...state, currentTime: clampTime(event.currentTime, state.duration) };
    case "ended":
      return { ...state, status: "ended" };
    case "error":
      return { ...state, status: "error", reason: event.reason };
    case "tv-action":
      return applyTvAction(state, event.action);
    case "reset":
      return { ...ORANGE_PLAYER_INITIAL };
    default:
      return state;
  }
}
