const Store = require('electron-store');

const store = new Store();

function saveSettings(settings) {
  store.set('settings', settings);
  return { success: true };
}

function loadSettings() {
  return store.get('settings') || {
    theme: 'dark',
    gamePath: '',
    protonVersion: '',
    steamApiKey: '',
    steamId: '',
    itchApiKey: '',
    syncInterval: 3600000,
    epicAccounts: [], // Array of Epic account IDs
    gameOptions: {}, // Per-game launch options
    controllerMappings: {} // Controller configurations
  };
}

module.exports = { saveSettings, loadSettings };
