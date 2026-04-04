import type { TileDescriptor } from "../../data/seedHome";
import styles from "./Tile.module.css";

interface TileProps {
  tile: TileDescriptor;
  focused: boolean;
}

export function Tile({ tile, focused }: TileProps) {
  const disabled = tile.disabled === true;
  const showProgress = !disabled && tile.progress != null && tile.progress > 0 && tile.progress < 1;
  const showRing = focused && !disabled;

  return (
    <div
      className={disabled ? styles.tileDisabled : showRing ? styles.tileFocused : styles.tile}
      role="button"
      tabIndex={-1}
      aria-disabled={disabled}
      aria-label={tile.title}
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
    </div>
  );
}
