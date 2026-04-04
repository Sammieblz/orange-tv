import type { ReactNode } from "react";
import styles from "./AppShell.module.css";

interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AppShell({ sidebar, children, footer }: AppShellProps) {
  return (
    <div className={styles.shell}>
      {sidebar}
      <main className={styles.main}>
        <div className={styles.scroll}>{children}</div>
        {footer}
      </main>
    </div>
  );
}
