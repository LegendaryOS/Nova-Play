const { exec } = require('child_process').promisify;
const path = require('path');
const { loadSettings } = require('../config');
const log = require('electron-log');

const protonDir = path.join(process.env.HOME, '.nova-play', 'protons');

async function launchGame(appid, platform, protonVersion, options = {}) {
  try {
    const settings = loadSettings();
    const { launchOptions = '', useNative = false, offline = false, dlc = [] } = options;
    
    let command;
    if (platform === 'EA') {
      const eaAppPath = settings.eaAppPath;
      if (!eaAppPath) throw new Error('EA App/Origin not configured');
      command = `"${eaAppPath}" --launch ${appid}`;
    } else if (useNative && platform === 'Epic') {
      command = `legendary launch ${appid} ${launchOptions} ${settings.gamePath ? `--base-path ${settings.gamePath}` : ''}`;
      if (dlc.length) command += ` --dlc ${dlc.join(' ')}`;
      if (offline) command += ' --offline';
    } else if (platform === 'Steam' && protonVersion) {
      const protonPath = path.join(protonDir, protonVersion, 'proton');
      command = `STEAM_COMPAT_CLIENT_INSTALL_PATH=${process.env.HOME}/.steam/steam STEAM_COMPAT_DATA_PATH=${process.env.HOME}/.proton/${appid} "${protonPath}" run ${appid} ${launchOptions}`;
    } else if (platform === 'Epic' && protonVersion) {
      const protonPath = path.join(protonDir, protonVersion, 'proton');
      command = `legendary launch ${appid} --wrapper "${protonPath} run" ${launchOptions} ${settings.gamePath ? `--base-path ${settings.gamePath}` : ''}`;
      if (dlc.length) command += ` --dlc ${dlc.join(' ')}`;
      if (offline) command += ' --offline';
    } else {
      throw new Error('Invalid launch configuration');
    }

    log.info(`Launching ${appid} on ${platform} with ${protonVersion || 'native'}`);
    await exec(command);
    return { success: true };
  } catch (error) {
    log.error(`Launch error for ${appid}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = { launchGame };
