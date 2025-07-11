const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { authPlatform } = require('./core/auth');
const { getLibraries } = require('./core/games/library');
const { launchGame } = require('./core/games/launcher');
const { getProtons, downloadProton } = require('./core/proton/proton');
const { systemAction } = require('./core/system');
const { saveSettings, loadSettings } = require('./core/config');

const protonDir = path.join(app.getPath('userData'), 'protons');
const configDir = path.join(app.getPath('userData'), 'config');

// Create main window
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 }
  });

  win.loadFile('gui/index.html');
  // win.webContents.openDevTools(); // Uncomment for debugging
}

app.whenReady().then(async () => {
  await fs.mkdir(protonDir, { recursive: true });
  await fs.mkdir(configDir, { recursive: true });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('auth-platform', async (event, platform) => authPlatform(platform));
ipcMain.handle('get-libraries', async () => getLibraries());
ipcMain.handle('get-protons', async () => getProtons());
ipcMain.handle('download-proton', async (event, version, url) => downloadProton(version, url));
ipcMain.handle('launch-game', async (event, appid, platform, protonVersion) => launchGame(appid, platform, protonVersion));
ipcMain.handle('system-action', async (event, action) => systemAction(action));
ipcMain.handle('save-settings', async (event, settings) => saveSettings(settings));
ipcMain.handle('load-settings', async () => loadSettings());
