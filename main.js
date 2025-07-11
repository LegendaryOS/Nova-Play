const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promisify;
const log = require('electron-log');
const { authPlatform } = require('./core/auth');
const { getLibraries, installGame, updateGame } = require('./core/games');
const { launchGame } = require('./core/games/launcher');
const { getProtons, downloadProton } = require('./core/proton/proton');
const { systemAction } = require('./core/system');
const { saveSettings, loadSettings } = require('./core/config');
const { getNotifications } = require('./core/notifications');
const { detectControllers } = require('./core/controllers');

const protonDir = path.join(app.getPath('userData'), 'protons');
const configDir = path.join(app.getPath('userData'), 'config');

log.initialize();
log.transports.file.resolvePath = () => path.join(configDir, 'logs/main.log');

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
  // win.webContents.openDevTools();
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
ipcMain.handle('auth-platform', async (event, platform) => {
  const result = await authPlatform(platform);
  log.info(`Auth ${platform}: ${result.success ? 'Success' : result.error}`);
  return result;
});
ipcMain.handle('get-libraries', async () => getLibraries());
ipcMain.handle('get-protons', async () => getProtons());
ipcMain.handle('download-proton', async (event, version, url) => downloadProton(version, url));
ipcMain.handle('launch-game', async (event, appid, platform, protonVersion, options) => launchGame(appid, platform, protonVersion, options));
ipcMain.handle('system-action', async (event, action) => systemAction(action));
ipcMain.handle('save-settings', async (event, settings) => saveSettings(settings));
ipcMain.handle('load-settings', async () => loadSettings());
ipcMain.handle('install-game', async (event, appid, platform) => installGame(appid, platform));
ipcMain.handle('update-game', async (event, appid, platform) => updateGame(appid, platform));
ipcMain.handle('get-notifications', async () => getNotifications());
ipcMain.handle('detect-controllers', async () => detectControllers());
