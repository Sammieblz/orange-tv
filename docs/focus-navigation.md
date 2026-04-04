# Launcher focus model and keyboard navigation

The TV launcher uses a **deterministic focus snapshot** in Zustand (`useFocusStore`), not browser DOM focus order, for predictable D-pad / arrow-key behavior.

## Focus snapshot (`FocusSnapshot`)

| Field | Meaning |
| --- | --- |
| **`section`** | **`sidebar`** — main rail; **`hero`** — featured strip; **`row`** — horizontal tile row. |
| **`sidebarIndex`** | Index into `HomeScreenData.nav` (which rail item is highlighted when `section === "sidebar"`). |
| **`rowIndex`** | Index into `HomeScreenData.rows` when `section === "row"`. Still meaningful when on hero for priming the first row transition. |
| **`colIndex`** | Index into `rows[rowIndex].tiles` when `section === "row"`. |

Implementation: [`launcher/src/store/focusStore.ts`](../launcher/src/store/focusStore.ts).  
Pure transitions: [`launcher/src/navigation/focusNavigation.ts`](../launcher/src/navigation/focusNavigation.ts).  
Keyboard wiring: [`launcher/src/hooks/useLauncherKeyboard.ts`](../launcher/src/hooks/useLauncherKeyboard.ts).

## Key map (default)

Modifier keys (**Alt**, **Ctrl**, **Meta**) are ignored so shortcuts do not steal TV navigation.

| Key | Sidebar | Hero | Row |
| --- | --- | --- | --- |
| **ArrowUp** | Previous nav item (clamp at 0) | Enter first row, first enabled tile | Previous row (or **hero** from row 0) |
| **ArrowDown** | Next nav item (clamp at last) | Enter first row, first enabled tile | Next row (clamp at last row) |
| **ArrowLeft** | No-op | **Sidebar** | Previous enabled tile, or **sidebar** from first column |
| **ArrowRight** | **Hero** | Enter first row, first enabled tile | Next enabled tile (clamp at last enabled) |
| **Enter** | Activate current nav `id` | Activate `hero-primary` | Activate focused tile `id` if not `disabled` |
| **Escape** | No-op | **Sidebar** | **Sidebar** |

If **`home.rows`** is empty, **hero** arrows that would enter the grid (**Up** / **Right** / **Down**) are **no-ops**.

## Disabled tiles

- Movement skips **`disabled: true`** tiles when moving **Left** / **Right**.
- **Enter** on a disabled tile does **not** fire activation.
- If a row has **only** disabled tiles, `firstEnabledCol` falls back to index **0** (still disabled); horizontal moves may have nowhere to go — **repro**: add a row of all `disabled: true` tiles and observe limited movement.

## Edge cases (reproducible)

1. **Sidebar clamp** — Focus **Settings** (last item), press **ArrowDown** repeatedly: index stays on last item.
2. **Rail → content** — From sidebar, **ArrowRight**: lands on **hero**. **ArrowRight** or **Down** or **Up** from hero: lands on **row 0**, first **enabled** tile (skips leading disabled tiles).
3. **Row → rail** — From first column of a row, **ArrowLeft**: **sidebar** (same `sidebarIndex` as before hero).
4. **Escape** — From hero or any row, **Escape**: **sidebar** (TV “back”).
5. **Enter** — On **Streaming** row, move to **Unavailable** (disabled), **Enter**: no `[launcher] activate` log for tile; move to an enabled tile and **Enter**: logs `tile <id>`.
6. **Last column** — On last enabled tile in a row, **ArrowRight**: focus unchanged.
7. **Last row** — On last row, **ArrowDown**: focus unchanged.
8. **Empty `nav`** — `sidebarIndex` stays clamped to **0** (defensive; seed data always has nav items).

## Overlays (reserved)

Future modals should use a dedicated **`section: "overlay"`** and/or an **`overlayId`** on the snapshot. Planned behavior: arrow keys do not move the underlying grid while an overlay is open; **Escape** dismisses the overlay first, then subsequent **Escape** can return to the rail. Not implemented in the current UI.

## Optional callback

`useLauncherKeyboard(home, { onActivate })` receives `{ context, id }` for **Enter** on sidebar, hero, or enabled tile (default is `console.log`).
