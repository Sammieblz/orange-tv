import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import type { TileDescriptor } from "@/data/seedHome.ts";
import styles from "./Tile.module.css";

interface TileProps {
  tile: TileDescriptor;
  focused: boolean;
}

export function Tile({ tile, focused }: TileProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const disabled = tile.disabled === true;
  const showProgress = !disabled && tile.progress != null && tile.progress > 0 && tile.progress < 1;
  const showRing = focused && !disabled;

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (disabled) {
      gsap.set(el, { scale: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(el, {
        scale: focused ? 1.08 : 1,
        duration: 0.12,
        ease: "power2.out",
        overwrite: "auto",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [focused, disabled]);

  return (
    <div
      ref={rootRef}
      className={disabled ? styles.tileDisabled : showRing ? styles.tileFocused : styles.tile}
      role="button"
      tabIndex={-1}
      aria-disabled={disabled}
      aria-label={tile.title}
      style={{ transformOrigin: "center center" }}
    >
      <div
        className={styles.art}
        style={tile.imageUrl ? { backgroundImage: `url(${tile.imageUrl})` } : undefined}
      >
        {!tile.imageUrl && <span className={styles.placeholder}>{tile.title.slice(0, 2)}</span>}
        {showProgress ? (
          <div className={styles.progressTrack} aria-hidden>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.round(tile.progress! * 100)}%` }}
            />
          </div>
        ) : null}
      </div>
      <span className={styles.caption}>{tile.title}</span>
      {tile.sessionHint ? <span className={styles.sessionHint}>{tile.sessionHint}</span> : null}
    </div>
  );
}
