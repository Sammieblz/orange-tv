import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApps } from "@/api/queries/useApps.ts";
import { useContinueWatching } from "@/api/queries/useContinueWatching.ts";
import { useHomeRecommendations } from "@/api/queries/useHomeRecommendations.ts";
import { ApiStatusBar } from "@/components/ApiStatusBar/ApiStatusBar.tsx";
import { AppShell } from "@/components/AppShell/AppShell.tsx";
import { RunningAppsDock } from "@/components/RunningAppsDock/RunningAppsDock.tsx";
import { ContentRow } from "@/components/ContentRow/ContentRow.tsx";
import { Hero } from "@/components/Hero/Hero.tsx";
import { Sidebar } from "@/components/Sidebar/Sidebar.tsx";
import { Tile } from "@/components/Tile/Tile.tsx";
import { buildAppsCatalogHome } from "@/data/appsCatalogHome.ts";
import { composeLauncherHome } from "@/data/composeLauncherHome.ts";
import { buildNavPlaceholderHome } from "@/data/navPlaceholderHome.ts";
import type { FocusActivatePayload } from "@/hooks/useFocusInputDispatch.ts";
import { useLauncherGamepad } from "@/hooks/useLauncherGamepad.ts";
import { useLauncherKeyboard } from "@/hooks/useLauncherKeyboard.ts";
import { useShellFocusRecovery } from "@/hooks/useShellFocusRecovery.ts";
import { launchAppTileIfActivated } from "@/launchFromTileActivate.ts";
import type { StreamingLaunchInputApp } from "@/player/streamingLaunchRoute.ts";
import { WebShellTopBar } from "@/player/WebShellTopBar.tsx";
import { useFocusStore } from "@/store/focusStore.ts";
import { useNavViewStore } from "@/store/navViewStore.ts";
import type { HomeScreenData } from "@/data/seedHome.ts";

export function LauncherPage() {
  const queryClient = useQueryClient();
  const appsQuery = useApps();
  const continueQuery = useContinueWatching();
  const recommendationsQuery = useHomeRecommendations();
  const activeMainNavId = useNavViewStore((s) => s.activeMainNavId);

  const feedHome = useMemo(
    () =>
      composeLauncherHome({
        continueItems: continueQuery.data?.items,
        continueStatus: continueQuery.status,
        recommendations: recommendationsQuery.data,
        recommendationsStatus: recommendationsQuery.status,
        apps: appsQuery.data?.items,
        appsStatus: appsQuery.status,
      }),
    [
      continueQuery.data?.items,
      continueQuery.status,
      recommendationsQuery.data,
      recommendationsQuery.status,
      appsQuery.data?.items,
      appsQuery.status,
    ],
  );

  const home: HomeScreenData = useMemo(() => {
    if (activeMainNavId === "home") {
      return feedHome;
    }
    if (activeMainNavId === "apps") {
      return buildAppsCatalogHome(appsQuery.data?.items, appsQuery.status);
    }
    return buildNavPlaceholderHome(activeMainNavId);
  }, [activeMainNavId, feedHome, appsQuery.data?.items, appsQuery.status]);

  const focus = useFocusStore((s) => s.focus);

  const [webShellEnabled, setWebShellEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const api = typeof window !== "undefined" ? window.orangeTv : undefined;
    api?.getRuntimeMetadata?.().then((meta) => {
      if (cancelled) return;
      setWebShellEnabled(Boolean(meta?.webShellEnabled));
    }).catch(() => {
      // best-effort: leave flag off when metadata unavailable
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const appsById = useMemo(() => {
    const map = new Map<string, StreamingLaunchInputApp>();
    for (const a of appsQuery.data?.items ?? []) {
      map.set(a.id, {
        id: a.id,
        type: a.type,
        launchUrl: a.launchUrl,
        chromeProfileSegment: a.chromeProfileSegment,
      });
    }
    return map;
  }, [appsQuery.data?.items]);

  const resolveApp = useCallback(
    (appId: string) => appsById.get(appId) ?? null,
    [appsById],
  );

  const selectSidebarNav = useCallback(
    (navId: string) => {
      const idx = feedHome.nav.findIndex((n) => n.id === navId);
      if (idx >= 0) {
        useFocusStore.getState().setFocus((f) => ({
          ...f,
          section: "sidebar",
          sidebarIndex: idx,
        }));
      }
      useNavViewStore.getState().setActiveMainNavId(navId);
    },
    [feedHome.nav],
  );

  const onActivate = useCallback(
    (payload: FocusActivatePayload) => {
      if (payload.context === "sidebar") {
        selectSidebarNav(payload.id);
        return;
      }
      void launchAppTileIfActivated(payload, {
        webShellEnabled,
        resolveApp,
        onLaunchSucceeded: () => {
          void queryClient.invalidateQueries({ queryKey: ["api", "apps"] });
          void queryClient.invalidateQueries({ queryKey: ["api", "watch", "continue"] });
          void queryClient.invalidateQueries({ queryKey: ["api", "recommendations", "home"] });
          void queryClient.invalidateQueries({ queryKey: ["api", "launch", "sessions", "active"] });
        },
      });
    },
    [queryClient, selectSidebarNav, webShellEnabled, resolveApp],
  );

  const activateTileById = useCallback(
    (tileId: string) => {
      for (let rowIndex = 0; rowIndex < home.rows.length; rowIndex++) {
        const tiles = home.rows[rowIndex].tiles;
        const colIndex = tiles.findIndex((t) => t.id === tileId);
        if (colIndex < 0) {
          continue;
        }
        const tile = tiles[colIndex];
        if (tile?.disabled) {
          return;
        }
        useFocusStore.getState().setFocus((f) => ({
          ...f,
          section: "row",
          rowIndex,
          colIndex,
        }));
        onActivate({ context: "tile", id: tileId });
        return;
      }
    },
    [home, onActivate],
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
    <>
      <WebShellTopBar />
      <AppShell
        sidebar={
        <Sidebar
          items={feedHome.nav}
          section={focus.section}
          sidebarIndex={focus.sidebarIndex}
          activeNavId={activeMainNavId}
          onSelectNav={selectSidebarNav}
        />
      }
      footer={
        <>
          <RunningAppsDock />
          <ApiStatusBar />
        </>
      }
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
              onPointerActivate={
                tile.disabled ? undefined : () => {
                    activateTileById(tile.id);
                  }
              }
            />
          ))}
        </ContentRow>
      ))}
      </AppShell>
    </>
  );
}
