const { loadSettings } = require('../config');

async function itchAuth() {
  const settings = loadSettings();
  if (!settings.itchApiKey) {
    throw new Error('itch.io API key required');
  }
  return { success: true, token: settings.itchApiKey };
}

module.exports = { itchAuth };
