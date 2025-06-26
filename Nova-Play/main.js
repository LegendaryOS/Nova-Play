const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { listEpicGames, loginEpic } = require('./legendary-wrapper');
const { listGogGames, loginGog } = require('./gog-wrapper');
const { runGameWithProton, getProtonVersions } = require('./proton-runner');
const { connectWallet, listWeb3Games } = require('./wallet-connector');
const { installProton, removeProton, listAvailableProtons } = require('./proton-manager');
const { logError } = require('./debug');

// Disable hardware acceleration to fix VSync errors
app.disableHardwareAcceleration();

let mainWindow;
let overlayWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webgl: false,
    },
    frame: false,
    backgroundColor: '#1a1a1a',
  });

  try {
    await mainWindow.webContents.session.clearCache();
    const indexPath = path.join(__dirname, 'index.html');
    await fs.access(indexPath);
    await mainWindow.loadFile(indexPath);
  } catch (error) {
    logError('Failed to load index.html: ' + error.message);
    mainWindow.loadURL('data:text/html,<h1>Error: Failed to load UI. Check console for details.</h1>');
  }

  overlayWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'overlay.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
  });

  try {
    await overlayWindow.loadFile('overlay.html');
  } catch (error) {
    logError('Failed to load overlay.html: ' + error.message);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-games', async (event, { platform, search }) => {
  try {
    const epicGames = await retryOperation(() => listEpicGames(), 3);
    const gogGames = await retryOperation(() => listGogGames(), 3);
    const web3Games = await listWeb3Games();
    let games = [...JSON.parse(epicGames), ...JSON.parse(gogGames), ...JSON.parse(web3Games)];
    if (platform) games = games.filter(game => game.platform === platform);
    if (search) games = games.filter(game => (game.app_name || game.title).toLowerCase().includes(search.toLowerCase()));
    return games;
  } catch (error) {
    logError('Failed to fetch games: ' + error.message);
    return { error: error.message };
  }
});

ipcMain.handle('get-proton-versions', async () => {
  try {
    const versions = await retryOperation(() => getProtonVersions(), 3);
    if (!versions.length) throw new Error('No Proton versions found. Install via Proton Manager.');
    return versions;
  } catch (error) {
    logError('Failed to fetch Proton versions: ' + error.message);
    return { error: error.message };
  }
});

ipcMain.handle('launch-game', async (event, { gamePath, protonVersion }) => {
  try {
    await runGameWithProton(gamePath, protonVersion);
    overlayWindow.show();
    return { success: true };
  } catch (error) {
    logError('Failed to launch game: ' + error.message);
    return { error: error.message };
  }
});

ipcMain.handle('connect-wallet', async (event, walletType) => {
  try {
    const address = await connectWallet(walletType);
    return { address };
  } catch (error) {
    logError('Wallet connection failed: ' + error.message);
    return { error: error.message };
  }
});

ipcMain.handle('login-epic', async () => {
  try {
    await loginEpic();
    return { success: true };
  } catch (error) {
    logError('Epic login failed: ' + error.message);
    return { error: error.message };
  }
});

ipcMain.handle('login-gog', async () => {
  try {
    await loginGog();
    return { success: true };
  } catch (error) {
    logError('GOG login failed: ' + error.message);
    return { error: error.message };
  }
});

ipcMain.handle('open-store', async (event, store) => {
  const urls = {
    epic: 'https://store.epicgames.com/en-US/login',
    gog: 'https://www.gog.com/en/account',
    web3: 'https://store.hyperplay.xyz',
  };
  try {
    await shell.openExternal(urls[store]);
  } catch (error) {
    logError('Failed to open store: ' + error.message);
  }
});

ipcMain.handle('manage-proton', async (event, { action, version }) => {
  try {
    mainWindow.webContents.send('proton-progress', { status: `Starting ${action} for ${version}...` });
    if (action === 'install') {
      await installProton(version);
      mainWindow.webContents.send('proton-progress', { status: `Installed ${version}` });
    } else if (action === 'remove') {
      await removeProton(version);
      mainWindow.webContents.send('proton-progress', { status: `Removed ${version}` });
    }
    return { success: true };
  } catch (error) {
    logError(`Proton ${action} failed: ${error.message}`);
    return { error: error.message };
  }
});

ipcMain.handle('list-available-protons', async () => {
  try {
    return await retryOperation(() => listAvailableProtons(), 3);
  } catch (error) {
    logError('Failed to fetch Proton releases: ' + error.message);
    return { error: error.message };
  }
});

ipcMain.on('close-overlay', () => {
  overlayWindow.hide();
});

// Retry async operations
async function retryOperation(operation, maxAttempts) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
