import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    /** Bind IPv4 explicitly so tools that probe 127.0.0.1 (e.g. wait-on) see the dev server on Windows. */
    host: "127.0.0.1",
    port: 5173,
    /** Avoid silently moving to 5174 while BrowserShell still opens http://localhost:5173 */
    strictPort: true,
  },
});
