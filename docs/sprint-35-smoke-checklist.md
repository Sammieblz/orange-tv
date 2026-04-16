# Sprint 3.5 smoke checklist (Windows + Ubuntu VM)

Use this for **Sprint 3.5 — Core App Usability & Live Integration** acceptance. Full Linux gate: [`linux-smoke-checklist.md`](linux-smoke-checklist.md). Windows setup: [`local-setup-windows.md`](local-setup-windows.md). Ubuntu VM: [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md).

## Shared (both platforms)

- [ ] API: `GET /api/v1/health` → 200.
- [ ] API: `GET /api/v1/home` → 200, `version` is `home-v1`, `rows` length 7, includes `continue` and `streaming`.
- [ ] API: `GET /api/v1/apps` → catalog includes seeded streaming apps and local media.
- [ ] Launcher home: Continue watching, recommendation rows, and **Streaming** row populate or show explicit empty/loading states (no fake Netflix episode titles).
- [ ] Activate a **Launch demo** tile: process launch attempted; on failure the **footer status line** shows `Launch failed: …` (not only the browser console).
- [ ] Activate an **app:** tile from the Streaming row (when present): same launch + feedback behavior.

## Windows (dev host)

- [ ] `npm run dev` (or project’s documented dev command) starts API + launcher; open the launcher URL and confirm no uncaught errors on first paint.
- [ ] Optional: `npm run dev:electron` — launch from a tile reaches the API via the Electron bridge; success shows a short **Launch started** line in the footer.

## Ubuntu VM

- [ ] Run the **P0** section of [`linux-smoke-checklist.md`](linux-smoke-checklist.md) on the VM.
- [ ] `curl -s http://localhost:5144/api/v1/home | head` returns JSON with `rows`.

Record **pass/fail**, **platform**, and **commit SHA** in the sprint ticket.
