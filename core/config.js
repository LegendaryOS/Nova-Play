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
    epicAccounts: [],
    gameOptions: {},
    controllerMappings: {}
  };
}

module.exports = { saveSettings, loadSettings };
