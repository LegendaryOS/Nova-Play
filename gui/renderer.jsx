import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import { motion } from 'framer-motion';
import GameCard from './components/GameCard.jsx';
import Sidebar from './components/Sidebar.jsx';
import Modal from './components/Modal.jsx';
import Store from './components/Store.jsx';

const App = () => {
  const [libraries, setLibraries] = useState([]);
  const [protons, setProtons] = useState([]);
  const [settings, setSettings] = useState({});
  const [currentTab, setCurrentTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlatform, setCurrentPlatform] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState([]);
  let web3, accounts, gameOptions = {};

  // Initialize Web3
  const initWeb3 = async () => {
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
  };

  // Log messages
  const logMessage = message => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const logError = message => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${message}`]);
  };

  // System actions
  const systemAction = async action => {
    if (['shutdown', 'restart', 'logout'].includes(action)) {
      if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    }
    try {
      const result = await window.electronAPI.invoke('system-action', action);
      if (!result.success) logError(result.error);
    } catch (error) {
      logError('System action failed: ' + error.message);
    }
  };

  // Switch tabs
  const switchTab = tab => setCurrentTab(tab);

  // Load libraries
  const loadLibraries = async () => {
    const libraries = await window.electronAPI.invoke('get-libraries');
    setLibraries(libraries);
    if (libraries.length > 0) loadGames(libraries[0].platform);
    loadNotifications();
  };

  // Load games for a platform
  const loadGames = async platform => {
    const libraries = await window.electronAPI.invoke('get-libraries');
    const protons = await window.electronAPI.invoke('get-protons');
    const settings = await window.electronAPI.invoke('load-settings');
    const games = libraries.find(lib => lib.platform === platform).games;
    setLibraries(libraries);
    setProtons(protons);
    setSettings(settings);
    setSearchQuery('');
  };

  // Search games
  const handleSearch = async e => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const libraries = await window.electronAPI.invoke('get-libraries');
    const protons = await window.electronAPI.invoke('get-protons');
    const settings = await window.electronAPI.invoke('load-settings');
    const allGames = libraries.flatMap(lib => lib.games);
    const filteredGames = allGames.filter(game => game.title.toLowerCase().includes(query));
    setLibraries([{ platform: 'Search', games: filteredGames }]);
    setProtons(protons);
    setSettings(settings);
  };

  // Load Proton versions
  const loadProtons = async () => {
    const protons = await window.electronAPI.invoke('get-protons');
    setProtons(protons);
  };

  // Refresh Proton list
  const refreshProtons = async () => {
    await loadProtons();
    logMessage('Proton list refreshed!');
  };

  // Download Proton
  const downloadProton = async (version, url) => {
    logMessage(`Downloading ${version}...`);
    try {
      const result = await window.electronAPI.invoke('download-proton', version, url);
      if (result.success) {
        logMessage(`${version} downloaded and extracted successfully!`);
        await loadProtons();
      } else {
        logError(`Failed to download ${version}: ${result.error}`);
      }
    } catch (error) {
      logError(`Download error: ${error.message}`);
    }
  };

  // Launch game
  const launchGame = async (appid, platform) => {
    const options = gameOptions[appid] || {};
    const protonVersion = options.protonVersion || settings.protonVersion;
    if (!protonVersion && !options.useNative) {
      logError('Please select a default Proton version or native mode.');
      return;
    }
    logMessage(`Launching ${appid} on ${platform} with ${protonVersion || 'native'}...`);
    try {
      const result = await window.electronAPI.invoke('launch-game', appid, platform, protonVersion, options);
      if (result.success) {
        logMessage('Game launched successfully!');
      } else {
        logError(`Failed to launch game: ${result.error}`);
      }
    } catch (error) {
      logError(`Launch error: ${error.message}`);
    }
  };

  // Install game
  const installGame = async (appid, platform) => {
    logMessage(`Installing ${appid} on ${platform}...`);
    try {
      const result = await window.electronAPI.invoke('install-game', appid, platform);
      if (result.success) {
        logMessage(`Installed ${appid} successfully!`);
        loadLibraries();
      } else {
        logError(`Failed to install ${appid}: ${result.error}`);
      }
    } catch (error) {
      logError(`Install error: ${error.message}`);
    }
  };

  // Update game
  const updateGame = async (appid, platform) => {
    logMessage(`Updating ${appid} on ${platform}...`);
    try {
      const result = await window.electronAPI.invoke('update-game', appid, platform);
      if (result.success) {
        logMessage(`Updated ${appid} successfully!`);
        loadLibraries();
      } else {
        logError(`Failed to update ${appid}: ${result.error}`);
      }
    } catch (error) {
      logError(`Update error: ${error.message}`);
    }
  };

  // Update game options
  const updateGameOptions = async (appid, protonVersion, launchOptions, offline) => {
    gameOptions[appid] = { ...gameOptions[appid], protonVersion, launchOptions, offline, useNative: protonVersion === 'native' };
    const newSettings = { ...settings, gameOptions };
    await window.electronAPI.invoke('save-settings', newSettings);
    setSettings(newSettings);
    logMessage(`Updated options for ${appid}`);
  };

  // Load notifications
  const loadNotifications = async () => {
    const notifications = await window.electronAPI.invoke('get-notifications');
    notifications.forEach(n => logMessage(`${n.platform}: ${n.message}`));
  };

  // Load controllers
  const loadControllers = async () => {
    const controllers = await window.electronAPI.invoke('detect-controllers');
    controllers.forEach(c => logMessage(`Detected controller: ${c.name}`));
  };

  // Load settings
  const loadSettings = async () => {
    const settings = await window.electronAPI.invoke('load-settings');
    setSettings(settings);
    document.body.className = settings.theme || 'dark';
  };

  // Save settings
  const saveSettings = async e => {
    e.preventDefault();
    const settings = {
      theme: e.target.theme.value,
      gamePath: e.target.gamePath.value,
      protonVersion: e.target.protonVersion.value,
      steamApiKey: e.target.steamApiKey.value,
      steamId: e.target.steamId.value,
      itchApiKey: e.target.itchApiKey.value,
      eaAppPath: e.target.eaAppPath.value,
      epicAccounts: e.target.epicAccounts.value.split(',').map(a => a.trim()).filter(a => a),
      syncInterval: parseInt(e.target.syncInterval.value),
      gameOptions
    };
    await window.electronAPI.invoke('save-settings', settings);
    setSettings(settings);
    document.body.className = settings.theme;
    logMessage('Settings saved!');
    loadLibraries();
  };

  // Authentication
  const authPlatform = async () => {
    if (currentPlatform === 'Web3') {
      await initWeb3();
    } else {
      const result = await window.electronAPI.invoke('auth-platform', currentPlatform);
      if (result.success) {
        logMessage(`${currentPlatform} authenticated successfully!`);
        loadLibraries();
      } else {
        logError(`Failed to authenticate ${currentPlatform}: ${result.error}`);
      }
    }
    setShowModal(false);
  };

  // Auto-sync libraries
  const startAutoSync = async () => {
    const settings = await window.electronAPI.invoke('load-settings');
    setInterval(loadLibraries, settings.syncInterval);
  };

  // Show auth modal
  const showAuthModal = platform => {
    setCurrentPlatform(platform);
    setShowModal(true);
  };

  // Initialize
  useEffect(() => {
    loadLibraries();
    loadProtons();
    loadSettings();
    loadControllers();
    startAutoSync();
    ['Steam', 'Epic', 'GOG', 'itch.io', 'EA', 'Web3'].forEach(platform => {
      window.electronAPI.invoke('auth-platform', platform).then(result => {
        if (!result.success) showAuthModal(platform);
      });
    });
  }, []);

  return (
    <div className="container">
      <Sidebar libraries={libraries} loadGames={loadGames} />
      <div className="main-content">
        <div className="tabs">
          <button className={`tab ${currentTab === 'library' ? 'active' : ''}`} onClick={() => switchTab('library')}>
            Library
          </button>
          <button className={`tab ${currentTab === 'store' ? 'active' : ''}`} onClick={() => switchTab('store')}>
            Store
          </button>
          <button className={`tab ${currentTab === 'proton' ? 'active' : ''}`} onClick={() => switchTab('proton')}>
            Proton Manager
          </button>
          <button className={`tab ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => switchTab('settings')}>
            Settings
          </button>
        </div>
        <div id="library" className={`tab-content ${currentTab === 'library' ? 'active' : ''}`}>
          <h2>Games</h2>
          <input type="text" id="search-games" placeholder="Search games..." value={searchQuery} onChange={handleSearch} />
          <div className="games-grid">
            {libraries[0]?.games.map(game => (
              <GameCard
                key={game.appid}
                game={game}
                protonVersions={protons}
                defaultProton={settings.protonVersion}
                onLaunch={launchGame}
                onInstall={installGame}
                onUpdate={updateGame}
                onOptionsChange={updateGameOptions}
              />
            ))}
          </div>
        </div>
        <Store />
        <div id="proton" className={`tab-content ${currentTab === 'proton' ? 'active' : ''}`}>
          <h2>Proton Manager</h2>
          <button onClick={refreshProtons}>Refresh Protons</button>
          <ul id="proton-list">
            {protons.map(proton => (
              <li key={proton.version}>
                {proton.version} ({proton.installed ? 'Installed' : 'Not Installed'})
                {!proton.installed && (
                  <button onClick={() => downloadProton(proton.version, proton.downloadUrl)}>Download</button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div id="settings" className={`tab-content ${currentTab === 'settings' ? 'active' : ''}`}>
          <h2>Settings</h2>
          <form id="settings-form" onSubmit={saveSettings}>
            <label>Theme:</label>
            <select name="theme" defaultValue={settings.theme || 'dark'}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
            <label>Game Path:</label>
            <input type="text" name="gamePath" defaultValue={settings.gamePath || ''} placeholder="/path/to/games" />
            <label>Default Proton:</label>
            <select name="protonVersion" defaultValue={settings.protonVersion || ''}>
              <option value="">None</option>
              {protons.filter(p => p.installed).map(p => (
                <option key={p.version} value={p.version}>{p.version}</option>
              ))}
            </select>
            <label>Steam API Key:</label>
            <input type="text" name="steamApiKey" defaultValue={settings.steamApiKey || ''} placeholder="Enter Steam API Key" />
            <label>Steam ID:</label>
            <input type="text" name="steamId" defaultValue={settings.steamId || ''} placeholder="Enter Steam ID" />
            <label>itch.io API Key:</label>
            <input type="text" name="itchApiKey" defaultValue={settings.itchApiKey || ''} placeholder="Enter itch.io API Key" />
            <label>EA App/Origin Path:</label>
            <input type="text" name="eaAppPath" defaultValue={settings.eaAppPath || ''} placeholder="/path/to/ea-app" />
            <label>Epic Accounts (comma-separated):</label>
            <input type="text" name="epicAccounts" defaultValue={settings.epicAccounts?.join(',') || ''} placeholder="account1,account2" />
            <label>Sync Interval (ms):</label>
            <input type="number" name="syncInterval" defaultValue={settings.syncInterval || 3600000} placeholder="3600000" />
            <button type="submit">Save</button>
          </form>
          <div className="logs">
            {logs.map((log, i) => (
              <p key={i} style={{ color: log.includes('ERROR') ? '#ff4444' : '#a0a0a0' }}>{log}</p>
            ))}
          </div>
        </div>
      </div>
      {showModal && <Modal platform={currentPlatform} onAuth={authPlatform} onClose={() => setShowModal(false)} />}
    </div>
  );
};

render(<App />, document.getElementById('root'));
