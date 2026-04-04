const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const isDev = process.env.ELECTRON_IS_DEV === "1" || process.env.ELECTRON_IS_DEV === "true";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  if (isDev) {
    const url = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    void win.loadURL(url);
  } else {
    void win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

ipcMain.handle("orange-tv:ping", () => "pong");

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
