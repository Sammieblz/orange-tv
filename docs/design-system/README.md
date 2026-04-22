# Design system (ui-ux-pro-max)

This folder holds the **persisted** output of the [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max) style search workflow, scoped for **Orange TV** (streaming / living-room product).

## Regenerate

From the repository root (requires Python 3 and a local `.cursor/skills/ui-ux-pro-max` tree — often present on a dev machine with Cursor skills installed):

```bash
npm run design-system
```

The script writes into `docs/design-system/` when possible. If the skill path is missing (e.g. `.cursor/` not checked in), the command exits successfully and you keep using the committed `MASTER.md`.

## Hierarchy

- **`MASTER.md`** — global recommendations (colors, type, spacing, anti-patterns).
- **`pages/`** — optional per-page overrides (create manually or extend the generator with `--page`).

Launcher-specific **orange accent, 10-foot layout, focus model, and engineering standards** are defined in [`.cursor/skills/orange-tv-design-system/SKILL.md`](../../.cursor/skills/orange-tv-design-system/SKILL.md) and `launcher/src/styles/variables.css`.
