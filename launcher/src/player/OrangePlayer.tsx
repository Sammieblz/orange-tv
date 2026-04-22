import { useCallback, useEffect, useReducer, useRef } from "react";
import { KEY_TO_ACTION, shouldCaptureAction } from "@/navigation/tvControlsContract.ts";
import {
  ORANGE_PLAYER_INITIAL,
  orangePlayerReducer,
  type OrangePlayerState,
} from "@/player/orangePlayerReducer.ts";
import styles from "./OrangePlayer.module.css";

export interface OrangePlayerProps {
  src: string;
  title?: string;
  /** Called once the user presses back / home so the launcher can exit the player surface. */
  onExit?: () => void;
  autoPlay?: boolean;
  /** Test hook: override the reducer init (used in unit tests). */
  initialState?: Partial<OrangePlayerState>;
}

/**
 * In-shell HTML5 `<video>` playback surface (SAM-56 spike). This is intentionally small;
 * codec support is whatever Electron's Chromium provides. Subtitles, casting, and DRM are
 * **not** goals here — commercial streaming belongs in `web-shell` (SAM-52).
 */
export function OrangePlayer({
  src,
  title,
  onExit,
  autoPlay = true,
  initialState,
}: OrangePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, dispatch] = useReducer(orangePlayerReducer, undefined, () => ({
    ...ORANGE_PLAYER_INITIAL,
    ...initialState,
  }));

  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    if (state.exitRequested) {
      onExitRef.current?.();
    }
  }, [state.exitRequested]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (state.status === "playing" && v.paused) {
      void v.play().catch((e) => {
        dispatch({ type: "error", reason: e instanceof Error ? e.message : "play-failed" });
      });
    }
    if (state.status === "paused" && !v.paused) {
      v.pause();
    }
  }, [state.status]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (Math.abs(v.currentTime - state.currentTime) > 0.75) {
      v.currentTime = state.currentTime;
    }
  }, [state.currentTime]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const action = KEY_TO_ACTION[event.key];
    if (!action) return;
    if (shouldCaptureAction("player", action)) {
      event.preventDefault();
      dispatch({ type: "tv-action", action });
    }
  }, []);

  return (
    <div
      className={styles.root}
      role="region"
      aria-label={title ?? "Orange Player"}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        autoPlay={autoPlay}
        preload="metadata"
        onLoadStart={() => dispatch({ type: "load-start" })}
        onLoadedMetadata={(e) =>
          dispatch({ type: "loaded-metadata", duration: e.currentTarget.duration })
        }
        onPlay={() => dispatch({ type: "play" })}
        onPause={() => dispatch({ type: "pause" })}
        onEnded={() => dispatch({ type: "ended" })}
        onTimeUpdate={(e) => dispatch({ type: "time-update", currentTime: e.currentTarget.currentTime })}
        onError={() => dispatch({ type: "error", reason: "media-error" })}
      >
        <track kind="captions" />
      </video>

      <div className={styles.overlay} aria-hidden={state.status === "playing"}>
        {title ? <h2 className={styles.title}>{title}</h2> : null}
        <p className={styles.status} data-testid="player-status">
          {state.status}
          {state.reason ? ` — ${state.reason}` : ""}
        </p>
      </div>
    </div>
  );
}
