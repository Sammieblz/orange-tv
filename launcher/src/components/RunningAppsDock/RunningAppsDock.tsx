import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { postLaunchSessionAction } from "@/api/client.ts";
import { useActiveLaunchSessions } from "@/api/queries/useActiveLaunchSessions.ts";
import type { ActiveLaunchSessionDto } from "@/api/types.ts";
import styles from "./RunningAppsDock.module.css";

function DockNotes() {
  return (
    <div className={styles.notes} role="note" aria-label="Shell and platform notes">
      <p>
        True OS-wide lock (for example, no Alt+Tab) is not what Electron alone guarantees; that is an OS or
        appliance image concern (kiosk Linux, assigned access, and similar).
      </p>
      <p>
        On Linux and macOS, minimize and foreground return 501 until a non-Windows implementation exists; the
        dock still lists active sessions from the API.
      </p>
    </div>
  );
}

async function focusShellIfPossible() {
  try {
    await window.orangeTv?.focusShell?.();
  } catch {
    // optional when not in Electron
  }
}

export function RunningAppsDock() {
  const queryClient = useQueryClient();
  const sessions = useActiveLaunchSessions();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onMinimize = useCallback(
    async (row: ActiveLaunchSessionDto) => {
      setBusyId(row.sessionId);
      try {
        const result = await postLaunchSessionAction(
          `/api/v1/launch/sessions/${row.sessionId}/minimize`,
        );
        if (result.ok) {
          await focusShellIfPossible();
        }
        void queryClient.invalidateQueries({ queryKey: ["api", "launch", "sessions", "active"] });
      } finally {
        setBusyId(null);
      }
    },
    [queryClient],
  );

  const onForeground = useCallback(
    async (row: ActiveLaunchSessionDto) => {
      setBusyId(row.sessionId);
      try {
        await postLaunchSessionAction(`/api/v1/launch/sessions/${row.sessionId}/foreground`);
        void queryClient.invalidateQueries({ queryKey: ["api", "launch", "sessions", "active"] });
      } finally {
        setBusyId(null);
      }
    },
    [queryClient],
  );

  const items = sessions.data?.items ?? [];

  if (sessions.isPending) {
    return (
      <div className={styles.wrap} aria-label="Running apps">
        <div className={styles.title}>Running apps</div>
        <div className={styles.empty}>Loading…</div>
        <DockNotes />
      </div>
    );
  }

  if (sessions.isError) {
    return (
      <div className={styles.wrap} aria-label="Running apps">
        <div className={styles.title}>Running apps</div>
        <div className={styles.empty}>Could not load sessions.</div>
        <DockNotes />
      </div>
    );
  }

  return (
    <div className={styles.wrap} aria-label="Running apps">
      <div className={styles.title}>Running apps</div>
      {items.length === 0 ? (
        <div className={styles.empty}>No external streaming sessions yet.</div>
      ) : (
        <div className={styles.list}>
          {items.map((row) => (
            <div key={row.sessionId} className={styles.card}>
              <div className={styles.label} title={row.label}>
                {row.label}
              </div>
              <div className={styles.meta}>
                {row.kind} · PID {row.pid}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btn}
                  disabled={busyId === row.sessionId}
                  onClick={() => {
                    void onMinimize(row);
                  }}
                >
                  Minimize
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={busyId === row.sessionId}
                  onClick={() => {
                    void onForeground(row);
                  }}
                >
                  Switch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <DockNotes />
    </div>
  );
}
