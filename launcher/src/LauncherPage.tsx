import { SEED_HOME } from "./data/seedHome";
import { useLauncherKeyboard } from "./hooks/useLauncherKeyboard";
import { AppShell } from "./components/launcher/AppShell";
import { ContentRow } from "./components/launcher/ContentRow";
import { Hero } from "./components/launcher/Hero";
import { Sidebar } from "./components/launcher/Sidebar";
import { Tile } from "./components/launcher/Tile";
import { useFocusStore } from "./store/focusStore";

export function LauncherPage() {
  const home = SEED_HOME;
  const focus = useFocusStore((s) => s.focus);

  useLauncherKeyboard(home);

  return (
    <AppShell
      sidebar={
        <Sidebar items={home.nav} section={focus.section} sidebarIndex={focus.sidebarIndex} />
      }
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
