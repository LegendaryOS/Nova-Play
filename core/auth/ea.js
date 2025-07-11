const { exec } = require('child_process').promisify;
const fs = require('fs').promisify;
const path = require('path');
const { loadSettings } = require('../config');
const log = require('electron-log');

async function eaAuth() {
  try {
    const settings = loadSettings();
    const eaAppPath = settings.eaAppPath || await findEAApp();
    
    if (!eaAppPath) {
      log.error('EA: EA App/Origin not found');
      throw new Error('EA App/Origin not found');
    }

    // Check if EA App/Origin is running
    const output = await exec('ps aux | grep -i "EA App\\|Origin" | grep -v grep');
    if (output) {
      log.info('EA: App/Origin running, assuming authenticated');
      return { success: true, token: 'ea-app' };
    }

    // Launch EA App/Origin for authentication
    await exec(`"${eaAppPath}" &`);
    log.info('EA: Launched EA App/Origin for authentication');
    return { success: true, token: 'ea-app' };
  } catch (error) {
    log.error(`EA auth error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function findEAApp() {
  const possiblePaths = [
    '/usr/lib/ea-app/EA App',
    '/usr/lib/origin/Origin',
    process.env.HOME + '/.wine/drive_c/Program Files/EA Games/EA Desktop/EA Desktop.exe',
    process.env.HOME + '/.wine/drive_c/Program Files (x86)/Origin/Origin.exe'
  ];
  for (const path of possiblePaths) {
    if (await fs.access(path).then(() => true).catch(() => false)) return path;
  }
  return null;
}

module.exports = { eaAuth };
