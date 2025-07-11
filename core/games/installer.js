const { exec } = require('child_process').promisify;
const log = require('electron-log');

async function installGame(appid, platform) {
  if (platform === 'Epic') {
    try {
      const output = await exec(`legendary install ${appid} --yes`);
      log.info(`Installed ${appid} on ${platform}`);
      return { success: true, output };
    } catch (error) {
      log.error(`Install error for ${appid}: ${error.message}`);
      return { success: false, error: error.message };
    }
  } else if (platform === 'EA') {
    log.warn(`EA installation requires EA App; please install manually`);
    return { success: false, error: 'EA installation requires EA App' };
  }
  return { success: false, error: `Installation not supported for ${platform}` };
}

async function updateGame(appid, platform) {
  if (platform === 'Epic') {
    try {
      const output = await exec(`legendary update ${appid} --yes`);
      log.info(`Updated ${appid} on ${platform}`);
      return { success: true, output };
    } catch (error) {
      log.error(`Update error for ${appid}: ${error.message}`);
      return { success: false, error: error.message };
    }
  } else if (platform === 'EA') {
    log.warn(`EA updates require EA App; please update manually`);
    return { success: false, error: 'EA updates require EA App' };
  }
  return { success: false, error: `Updates not supported for ${platform}` };
}

module.exports = { installGame, updateGame };
