import type { ReactNode } from "react";
import styles from "./ContentRow.module.css";

interface ContentRowProps {
  title: string;
  children: ReactNode;
}

export function ContentRow({ title, children }: ContentRowProps) {
  return (
    <section className={styles.row} aria-label={title}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.track}>{children}</div>
    </section>
  );
}
