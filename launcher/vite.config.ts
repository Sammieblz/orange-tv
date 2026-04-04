import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    /** Avoid silently moving to 5174 while BrowserShell still opens http://localhost:5173 */
    strictPort: true,
  },
});
