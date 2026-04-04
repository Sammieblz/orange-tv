# Gamepad input and focus recovery

## Gamepad (baseline)

The launcher polls the **Gamepad API** in the renderer (`useLauncherGamepad`) and feeds the same deterministic model as the keyboard (`applyFocusKey` in [`launcher/src/navigation/focusNavigation.ts`](../launcher/src/navigation/focusNavigation.ts)).

### Supported (first pass)

- **First connected gamepad only** — additional controllers are ignored.
- **Edge-trigger only** — no hold-to-repeat; each distinct press / stick exit-from-neutral emits one navigation step.
- **Buttons**
  - **0** — **Enter** (primary action).
  - **1** — **Escape** (back).
  - **12–15** — D-pad as buttons when exposed (**Up / Down / Left / Right**), common on Chromium with `mapping === "standard"`.
- **Left stick** — axes **0** and **1**: deadzone **0.35**, release threshold **0.2**; dominant axis picks one direction per neutral-to-tilt transition.

### Explicitly unsupported or variable (documented gaps)

| Gap | Notes |
| --- | --- |
| **Second+ gamepads** | Not scanned; TV couch multiplayer not handled. |
| **Right stick, triggers, shoulders** | Not mapped. |
| **Hot-plug** | First pad may not appear until a button press on some browsers (`getGamepads()` quirk). |
| **Non-standard mappings** | Firefox / Safari / odd drivers may use different button indices; D-pad may be axes-only. |
| **Remapping UI** | None; no WebHID profile editor. |
| **Repeat / acceleration** | Intentionally omitted in baseline. |

### Linux / Ubuntu

Renderer uses the browser’s Gamepad API; **no extra permissions** are typically required for USB/Bluetooth pads in Electron or Chromium. If a pad never appears, try a button press once and check `chrome://gamepad` (Chromium) or the OS joystick tester.

## Focus recovery

Logical focus lives in [`launcher/src/store/focusStore.ts`](../launcher/src/store/focusStore.ts). Recovery uses a **checkpoint** snapshot and optional **deferred shell restore**.

### Modal / overlay (caller-driven)

When you open a modal (future UI):

1. **`saveFocusCheckpoint()`** — stores current `FocusSnapshot`.
2. On close, **`restoreFocusCheckpoint()`** — restores focus and clears checkpoint + shell pending.

No automatic behavior until you add overlay components that call these APIs.

### Return from external app / shell (deferred)

Before handing off to an external process (e.g. after a future successful **`launchRequest`**):

1. **`requestShellFocusRestore()`** — copies current focus into the checkpoint and sets **`shellRestorePending`**.

When the user returns:

- **`useShellFocusRecovery`** runs **`consumeShellFocusRestoreIfPending`** on:
  - **`window` `focus`**
  - **`document.visibilitychange`** to **visible**
  - Electron **`orangeTv.onShellForeground()`** — fired from main when the `BrowserWindow` **focuses after a prior blur** (see [`launcher/electron/main.cjs`](../launcher/electron/main.cjs)).

If **`shellRestorePending`** and a checkpoint exist, focus is restored once and flags cleared.

Random window focus without **`requestShellFocusRestore()`** does **not** overwrite the user’s current focus (pending gate).

### Dev-only QA helpers

With **`import.meta.env.DEV`**, the launcher exposes **`window.__orangeTvFocusDebug`**:

- **`requestShellFocusRestore()`** — arm restore, then Alt-Tab away and back (or blur/focus the window) to verify checkpoint restore.
- **`saveFocusCheckpoint`**, **`restoreFocusCheckpoint`**, **`clearFocusCheckpoint`** — modal flow testing.

## Related docs

- Keyboard and focus edges: [`focus-navigation.md`](focus-navigation.md)
- Electron preload / IPC: [`electron-shell.md`](electron-shell.md)
