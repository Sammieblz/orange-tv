import { ApiStatusBar } from "@/components/ApiStatusBar/ApiStatusBar.tsx";
import { AppShell } from "@/components/AppShell/AppShell.tsx";
import { ContentRow } from "@/components/ContentRow/ContentRow.tsx";
import { Hero } from "@/components/Hero/Hero.tsx";
import { Sidebar } from "@/components/Sidebar/Sidebar.tsx";
import { Tile } from "@/components/Tile/Tile.tsx";
import { SEED_HOME } from "@/data/seedHome.ts";
import { useLauncherKeyboard } from "@/hooks/useLauncherKeyboard.ts";
import { useFocusStore } from "@/store/focusStore.ts";

export function LauncherPage() {
  const home = SEED_HOME;
  const focus = useFocusStore((s) => s.focus);

  useLauncherKeyboard(home);

  return (
    <AppShell
      sidebar={
        <Sidebar items={home.nav} section={focus.section} sidebarIndex={focus.sidebarIndex} />
      }
      footer={<ApiStatusBar />}
    >
      <Hero content={home.hero} focused={focus.section === "hero"} />
      {home.rows.map((row, rowIndex) => (
        <ContentRow key={row.id} title={row.title}>
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
