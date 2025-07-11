const { exec } = require('child_process').promisify;
const path = require('path');

const protonDir = path.join(process.env.HOME, '.nova-play', 'protons');

async function launchGame(appid, platform, protonVersion) {
  try {
    const protonPath = path.join(protonDir, protonVersion, 'proton');
    let command;
    if (platform === 'Steam') {
      command = `STEAM_COMPAT_CLIENT_INSTALL_PATH=${process.env.HOME}/.steam/steam STEAM_COMPAT_DATA_PATH=${process.env.HOME}/.proton/${appid} "${protonPath}" run ${appid}`;
    } else if (platform === 'Epic') {
      command = `legendary launch ${appid} --wrapper "${protonPath} run"`;
    } else {
      throw new Error('Unsupported platform');
    }
    await exec(command);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { launchGame };
