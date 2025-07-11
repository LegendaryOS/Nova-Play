const { exec } = require('child_process').promisify;
const { loadSettings } = require('../config');
const fs = require('fs').promisify;

async function epicAuth() {
  try {
    const settings = loadSettings();
    const configPath = process.env.HOME + '/.config/legendary/config.ini';
    
    // Check if already authenticated
    if (await fs.access(configPath).then(() => true).catch(() => false)) {
      const output = await exec('legendary auth --check');
      if (output.includes('Successfully logged in')) {
        return { success: true, token: 'legendary' };
      }
    }

    // Attempt automatic login with stored token
    if (settings.epicAccounts.length > 0) {
      for (const account of settings.epicAccounts) {
        await exec(`legendary auth --account ${account}`);
        const check = await exec('legendary auth --check');
        if (check.includes('Successfully logged in')) {
          return { success: true, token: 'legendary', account };
        }
      }
    }

    // Trigger manual authentication
    throw new Error('Authentication required');
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { epicAuth };
