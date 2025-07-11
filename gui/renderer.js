const { electronAPI } = window;
let web3, accounts, gameOptions = {};

// Initialize Web3
async function initWeb3() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      logMessage('Web3 authenticated successfully!');
      loadLibraries();
    } catch (error) {
      logError('Web3 authentication failed: ' + error.message);
    }
  } else {
    logError('MetaMask not detected');
  }
}

// Toggle Nova menu
document.getElementById('nova-menu-btn').addEventListener('click', () => {
  const menu = document.querySelector('.nova-menu-dropdown');
  menu.classList.toggle('hidden');
});

// System actions
async function systemAction(action) {
  if (['shutdown', 'restart', 'logout'].includes(action)) {
    const confirm = window.confirm(`Are you sure you want to ${action}?`);
    if (!confirm) return;
  }
  try {
    const result = await electronAPI.invoke('system-action', action);
    if (!result.success) logError(result.error);
  } catch (error) {
    logError('System action failed: ' + error.message);
  }
}

// Switch tabs
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// Load libraries
async function loadLibraries() {
  const libraries = await electronAPI.invoke('get-libraries');
  renderLibraryList(libraries, loadGames);
  if (libraries.length > 0) loadGames(libraries[0].platform);
  loadNotifications();
}

// Load games for a platform
async function loadGames(platform) {
  const libraries = await electronAPI.invoke('get-libraries');
  const protons = await electronAPI.invoke('get-protons');
  const settings = await electronAPI.invoke('load-settings');
  const games = libraries.find(lib => lib.platform === platform).games;
  const gamesList = document.getElementById('games-list');
  gamesList.innerHTML = games.map(game => renderGameCard(game, protons, settings.protonVersion)).join('');
}

// Search games
document.getElementById('search-games').addEventListener('input', async (e) => {
  const query = e.target.value.toLowerCase();
  const libraries = await electronAPI.invoke('get-libraries');
  const protons = await electronAPI.invoke('get-protons');
  const settings = await electronAPI.invoke('load-settings');
  const allGames = libraries.flatMap(lib => lib.games);
  const filteredGames = allGames.filter(game => game.title.toLowerCase().includes(query));
  const gamesList = document.getElementById('games-list');
  gamesList.innerHTML = filteredGames.map(game => renderGameCard(game, protons, settings.protonVersion)).join('');
});

// Load Proton versions
async function loadProtons() {
  const protons = await electronAPI.invoke('get-protons');
  const protonList = document.getElementById('proton-list');
  protonList.innerHTML = protons.map(proton => `
    <li>${proton.version} (${proton.installed ? 'Installed' : 'Not Installed'})
      ${!proton.installed ? `<button onclick="downloadProton('${proton.version}', '${proton.downloadUrl}')">Download</button>` : ''}
    </li>
  `).join('');

  const protonSelect = document.getElementById('proton-version');
  protonSelect.innerHTML = '<option value="">None</option>' + protons
    .filter(p => p.installed)
    .map(p => `<option value="${p.version}">${p.version}</option>`)
    .join('');
}

// Refresh Proton list
async function refreshProtons() {
  await loadProtons();
  logMessage('Proton list refreshed!');
}

// Download Proton
async function downloadProton(version, url) {
  logMessage(`Downloading ${version}...`);
  try {
    const result = await electronAPI.invoke('download-proton', version, url);
    if (result.success) {
      logMessage(`${version} downloaded and extracted successfully!');
      await loadProtons();
    } else {
      logError(`Failed to download ${version}: ${result.error}`);
    }
  } catch (error) {
    logError(`Download error: ${error.message}`);
  }
}

// Launch game
async function launchGame(appid, platform) {
  const settings = await electronAPI.invoke('load-settings');
  const options = gameOptions[appid] || {};
  const protonVersion = options.protonVersion || settings.protonVersion;
  if (!protonVersion && !options.useNative) {
    logError('Please select a default Proton version or native mode.');
    return;
  }
  logMessage(`Launching ${appid} on ${platform} with ${protonVersion || 'native'}...`);
  try {
    const result = await electronAPI.invoke('launch-game', appid, platform, protonVersion, options);
    if (result.success) {
      logMessage('Game launched successfully!');
    } else {
      logError(`Failed to launch game: ${result.error}`);
    }
  } catch (error) {
    logError(`Launch error: ${error.message}`);
  }
}

// Install game
async function installGame(appid, platform) {
  logMessage(`Installing ${appid} on ${platform}...`);
  try {
    const result = await electronAPI.invoke('install-game', appid, platform);
    if (result.success) {
      logMessage(`Installed ${appid} successfully!`);
      loadLibraries();
    } else {
      logError(`Failed to install ${appid}: ${result.error}`);
    }
  } catch (error) {
    logError(`Install error: ${error.message}`);
  }
}

// Update game
async function updateGame(appid, platform) {
  logMessage(`Updating ${appid} on ${platform}...`);
  try {
    const result = await electronAPI.invoke('update-game', appid, platform);
    if (result.success) {
      logMessage(`Updated ${appid} successfully!`);
      loadLibraries();
    } else {
      logError(`Failed to update ${appid}: ${result.error}`);
    }
  } catch (error) {
    logError(`Update error: ${error.message}`);
  }
}

// Update game options
async function updateGameOptions(appid, protonVersion, launchOptions) {
  gameOptions[appid] = { ...gameOptions[appid], protonVersion, launchOptions };
  const settings = await electronAPI.invoke('load-settings');
  settings.gameOptions = gameOptions;
  await electronAPI.invoke('save-settings', settings);
  logMessage(`Updated options for ${appid}`);
}

// Load notifications
async function loadNotifications() {
  const notifications = await electronAPI.invoke('get-notifications');
  notifications.forEach(n => logMessage(`${n.platform}: ${n.message}`));
}

// Load controllers
async function loadControllers() {
  const controllers = await electronAPI.invoke('detect-controllers');
  controllers.forEach(c => logMessage(`Detected controller: ${c.name}`));
}

// Load settings
async function loadSettings() {
  const settings = await electronAPI.invoke('load-settings');
  const form = document.getElementById('settings-form');
  form.theme.value = settings.theme || 'dark';
  form.gamePath.value = settings.gamePath || '';
  form.protonVersion.value = settings.protonVersion || '';
  form.steamApiKey.value = settings.steamApiKey || '';
  form.steamId.value = settings.steamId || '';
  form.itchApiKey.value = settings.itchApiKey || '';
  form.epicAccounts.value = settings.epicAccounts.join(',') || '';
  form.syncInterval.value = settings.syncInterval || 3600000;
  gameOptions = settings.gameOptions || {};
  document.body.className = settings.theme || 'dark';
}

// Save settings
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const settings = {
    theme: e.target.theme.value,
    gamePath: e.target.gamePath.value,
    protonVersion: e.target.protonVersion.value,
    steamApiKey: e.target.steamApiKey.value,
    steamId: e.target.steamId.value,
    itchApiKey: e.target.itchApiKey.value,
    epicAccounts: e.target.epicAccounts.value.split(',').map(a => a.trim()).filter(a => a),
    syncInterval: parseInt(e.target.syncInterval.value),
    gameOptions
  };
  await electronAPI.invoke('save-settings', settings);
  document.body.className = settings.theme;
  logMessage('Settings saved!');
  loadLibraries();
});

// Authentication
async function authPlatform() {
  if (currentPlatform === 'Web3') {
    await initWeb3();
  } else {
    const result = await electronAPI.invoke('auth-platform', currentPlatform);
    if (result.success) {
      logMessage(`${currentPlatform} authenticated successfully!`);
      loadLibraries();
    } else {
      logError(`Failed to authenticate ${currentPlatform}: ${result.error}`);
    }
  }
  closeModal();
}

// Auto-sync libraries
async function startAutoSync() {
  const settings = await electronAPI.invoke('load-settings');
  setInterval(loadLibraries, settings.syncInterval);
}

// Log messages
function logMessage(message) {
  const logs = document.getElementById('logs');
  logs.innerHTML += `<p>[${new Date().toLocaleTimeString()}] ${message}</p>`;
  logs.scrollTop = logs.scrollHeight;
}

function logError(message) {
  const logs = document.getElementById('logs');
  logs.innerHTML += `<p style="color: #ff4444">[${new Date().toLocaleTimeString()}] ERROR: ${message}</p>`;
  logs.scrollTop = logs.scrollHeight;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadLibraries();
  loadProtons();
  loadSettings();
  loadControllers();
  startAutoSync();
  ['Steam', 'Epic', 'GOG', 'itch.io', 'Web3'].forEach(platform => {
    electronAPI.invoke('auth-platform', platform).then(result => {
      if (!result.success) showAuthModal(platform);
    });
  });
});
