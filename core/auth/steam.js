const { loadSettings } = require('../config');

async function steamAuth() {
  const settings = loadSettings();
  if (!settings.steamApiKey || !settings.steamId) {
    throw new Error('Steam API key and Steam ID required');
  }
  return { success: true, token: settings.steamApiKey };
}

module.exports = { steamAuth };
