/**
 * Unified TV controls contract across the three Orange TV surfaces.
 *
 * This is a **pure, declarative** source of truth for SAM-53 / SAM-58: it does not
 * import React, Electron, or DOM types. The launcher wires keyboard/gamepad input
 * in `hooks/useLauncherKeyboard.ts` and `hooks/useLauncherGamepad.ts`; the Orange
 * Player and Streaming shell will consume the relevant surface from this module.
 *
 * See `docs/player-and-streaming-strategy.md` → "Unified TV controls" and
 * `docs/focus-navigation.md`.
 */

/** Logical actions a TV remote / gamepad can produce in Orange TV. */
export type TvAction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "confirm"
  | "back"
  | "play-pause"
  | "seek-forward"
  | "seek-back"
  | "home"
  | "menu";

/** Surfaces Orange TV owns (directly or as a locked container). */
export type TvSurface =
  | "launcher"
  /** Orange Player (first-party playback). */
  | "player"
  /** In-app web surface (BrowserView) for DRM streaming tiles. */
  | "web-shell";

/** How the surface treats the action. */
export type TvActionHandling =
  /** Orange TV handles the action directly. */
  | "shell"
  /** Orange TV forwards the logical key, but the page / embedded content may override. */
  | "delegated"
  /** Action is intentionally ignored on this surface. */
  | "ignored";

export interface TvSurfaceControls {
  readonly surface: TvSurface;
  readonly actions: Readonly<Record<TvAction, TvActionHandling>>;
  /** What **back** does at the top level of this surface (documentation string). */
  readonly backExitsTo: "none" | "sidebar" | "launcher";
}

/**
 * Canonical contract. Keep in sync with:
 * - `applyFocusKey` in `navigation/focusNavigation.ts` (launcher)
 * - Orange Player keybindings
 * - BrowserView key forwarding rules
 */
export const TV_CONTROLS_CONTRACT: Readonly<Record<TvSurface, TvSurfaceControls>> = Object.freeze({
  launcher: Object.freeze({
    surface: "launcher",
    actions: Object.freeze({
      up: "shell",
      down: "shell",
      left: "shell",
      right: "shell",
      confirm: "shell",
      back: "shell",
      "play-pause": "ignored",
      "seek-forward": "ignored",
      "seek-back": "ignored",
      home: "shell",
      menu: "shell",
    }),
    backExitsTo: "sidebar",
  }),
  player: Object.freeze({
    surface: "player",
    actions: Object.freeze({
      up: "shell",
      down: "shell",
      left: "shell",
      right: "shell",
      confirm: "shell",
      back: "shell",
      "play-pause": "shell",
      "seek-forward": "shell",
      "seek-back": "shell",
      home: "shell",
      menu: "shell",
    }),
    backExitsTo: "launcher",
  }),
  "web-shell": Object.freeze({
    surface: "web-shell",
    actions: Object.freeze({
      up: "delegated",
      down: "delegated",
      left: "delegated",
      right: "delegated",
      confirm: "delegated",
      /** Back is **captured** by the shell so the user always has a way home. */
      back: "shell",
      "play-pause": "delegated",
      "seek-forward": "delegated",
      "seek-back": "delegated",
      home: "shell",
      menu: "shell",
    }),
    backExitsTo: "launcher",
  }),
});

/** Default mapping from DOM keys / gamepad buttons → logical TV actions. */
export const KEY_TO_ACTION: Readonly<Record<string, TvAction>> = Object.freeze({
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "confirm",
  Escape: "back",
  Backspace: "back",
  " ": "play-pause",
  k: "play-pause",
  K: "play-pause",
  l: "seek-forward",
  L: "seek-forward",
  j: "seek-back",
  J: "seek-back",
  h: "home",
  H: "home",
  m: "menu",
  M: "menu",
});

/** Does a TV action need to be captured before the page / video element sees it? */
export function shouldCaptureAction(
  surface: TvSurface,
  action: TvAction,
): boolean {
  return TV_CONTROLS_CONTRACT[surface].actions[action] === "shell";
}

/** What happens to **back** at the root of the given surface. */
export function backDestination(
  surface: TvSurface,
): "none" | "sidebar" | "launcher" {
  return TV_CONTROLS_CONTRACT[surface].backExitsTo;
}

/** Validates the contract (kept for defensive tests). */
export function listContractedSurfaces(): readonly TvSurface[] {
  return Object.freeze(Object.keys(TV_CONTROLS_CONTRACT) as TvSurface[]);
}
