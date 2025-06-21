import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import * as path from "path";
import express from "express";

let tray: Tray;
let mainWindow: BrowserWindow;
let isQuitting = false;

const webServer = express();
const serverPort = 9191;

async function createWebServer() {
  webServer.use(express.json());
  webServer.use(express.urlencoded({ extended: true }));

  webServer.get("/", (req, res) => {
    res.json({ status: "healthy", uptime: process.uptime() });
  });

  webServer.listen(serverPort, () => {
    console.log(`Web server running on http://localhost:${serverPort}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: process.env.NODE_ENV === "development",
    minimizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();

    // Suppress common DevTools warnings
    mainWindow.webContents.on("console-message", (event, level, message) => {
      if (message.includes("Autofill.enable")) {
        return; // Suppress autofill warnings
      }
    });
  }

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "assets", "tray.png")
  );
  const trayIcon = icon.resize({ width: 16, height: 16 });
  trayIcon.setTemplateImage(true);
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: "Hide App",
      click: () => {
        mainWindow?.hide();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("MCP Relay");
}

app.whenReady().then(async () => {
  createWindow();
  createTray();

  try {
    await createWebServer();
  } catch (error) {
    console.error("Failed to start web server:", error);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});
