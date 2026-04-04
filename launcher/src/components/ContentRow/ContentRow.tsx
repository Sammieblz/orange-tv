import type { ReactNode } from "react";
import styles from "./ContentRow.module.css";

interface ContentRowProps {
  title: string;
  /** When true, screen readers get a focused-row hint (logical focus is store-driven). */
  isFocusedRow?: boolean;
  children: ReactNode;
}

export function ContentRow({ title, isFocusedRow, children }: ContentRowProps) {
  const rowLabel = isFocusedRow ? `${title}, focused row` : title;
  return (
    <section
      className={styles.row}
      aria-label={rowLabel}
      data-focused-row={isFocusedRow ? "true" : undefined}
    >
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.track}>{children}</div>
    </section>
  );
}
