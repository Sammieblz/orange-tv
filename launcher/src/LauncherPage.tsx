import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useApps } from "@/api/queries/useApps.ts";
import { ApiStatusBar } from "@/components/ApiStatusBar/ApiStatusBar.tsx";
import { AppShell } from "@/components/AppShell/AppShell.tsx";
import { ContentRow } from "@/components/ContentRow/ContentRow.tsx";
import { Hero } from "@/components/Hero/Hero.tsx";
import { Sidebar } from "@/components/Sidebar/Sidebar.tsx";
import { Tile } from "@/components/Tile/Tile.tsx";
import { mergeHomeScreenWithApps } from "@/data/mergeHomeWithApps.ts";
import { SEED_HOME } from "@/data/seedHome.ts";
import type { FocusActivatePayload } from "@/hooks/useFocusInputDispatch.ts";
import { useLauncherGamepad } from "@/hooks/useLauncherGamepad.ts";
import { useLauncherKeyboard } from "@/hooks/useLauncherKeyboard.ts";
import { useShellFocusRecovery } from "@/hooks/useShellFocusRecovery.ts";
import { launchAppTileIfActivated } from "@/launchFromTileActivate.ts";
import { useFocusStore } from "@/store/focusStore.ts";

export function LauncherPage() {
  const queryClient = useQueryClient();
  const appsQuery = useApps();
  const home = useMemo(
    () => mergeHomeScreenWithApps(SEED_HOME, appsQuery.data?.items),
    [appsQuery.data?.items],
  );
  const focus = useFocusStore((s) => s.focus);

  const onActivate = useCallback(
    (payload: FocusActivatePayload) => {
      void launchAppTileIfActivated(payload, {
        onLaunchSucceeded: () => {
          void queryClient.invalidateQueries({ queryKey: ["api", "apps"] });
        },
      });
    },
    [queryClient],
  );

  useLauncherKeyboard(home, { onActivate });
  useLauncherGamepad(home, { onActivate });
  useShellFocusRecovery();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (
      window as unknown as {
        __orangeTvFocusDebug?: {
          saveFocusCheckpoint: () => void;
          restoreFocusCheckpoint: () => void;
          requestShellFocusRestore: () => void;
          clearFocusCheckpoint: () => void;
        };
      }
    ).__orangeTvFocusDebug = {
      saveFocusCheckpoint: () => useFocusStore.getState().saveFocusCheckpoint(),
      restoreFocusCheckpoint: () => useFocusStore.getState().restoreFocusCheckpoint(),
      requestShellFocusRestore: () => useFocusStore.getState().requestShellFocusRestore(),
      clearFocusCheckpoint: () => useFocusStore.getState().clearFocusCheckpoint(),
    };
  }, []);

  return (
    <AppShell
      sidebar={
        <Sidebar items={home.nav} section={focus.section} sidebarIndex={focus.sidebarIndex} />
      }
      footer={<ApiStatusBar />}
    >
      <Hero content={home.hero} focused={focus.section === "hero"} />
      {home.rows.map((row, rowIndex) => (
        <ContentRow
          key={row.id}
          title={row.title}
          isFocusedRow={focus.section === "row" && focus.rowIndex === rowIndex}
        >
          {row.tiles.map((tile, colIndex) => (
            <Tile
              key={tile.id}
              tile={tile}
              focused={
                focus.section === "row" &&
                focus.rowIndex === rowIndex &&
                focus.colIndex === colIndex
              }
            />
          ))}
        </ContentRow>
      ))}
    </AppShell>
  );
}
