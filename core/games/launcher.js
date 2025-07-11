const { exec } = require('child_process').promisify;
const path = require('path');
const { loadSettings } = require('../config');

const protonDir = path.join(process.env.HOME, '.nova-play', 'protons');

async function launchGame(appid, platform, protonVersion, options = {}) {
  try {
    const settings = loadSettings();
    const { launchOptions = '', useNative = false } = options;
    
    let command;
    if (useNative && platform === 'Epic') {
      command = `legendary launch ${appid} ${launchOptions} ${settings.gamePath ? `--base-path ${settings.gamePath}` : ''}`;
    } else if (platform === 'Steam' && protonVersion) {
      const protonPath = path.join(protonDir, protonVersion, 'proton');
      command = `STEAM_COMPAT_CLIENT_INSTALL_PATH=${process.env.HOME}/.steam/steam STEAM_COMPAT_DATA_PATH=${process.env.HOME}/.proton/${appid} "${protonPath}" run ${appid} ${launchOptions}`;
    } else if (platform === 'Epic' && protonVersion) {
      const protonPath = path.join(protonDir, protonVersion, 'proton');
      command = `legendary launch ${appid} --wrapper "${protonPath} run" ${launchOptions} ${settings.gamePath ? `--base-path ${settings.gamePath}` : ''}`;
    } else {
      throw new Error('Invalid launch configuration');
    }

    if (options.offline) command += ' --offline';
    await exec(command);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { launchGame };
