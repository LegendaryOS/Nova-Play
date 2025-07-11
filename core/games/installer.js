const { exec } = require('child_process').promisify;

async function installGame(appid, platform) {
  if (platform !== 'Epic') return { success: false, error: 'Installation only supported for Epic Games' };
  try {
    const output = await exec(`legendary install ${appid} --yes`);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateGame(appid, platform) {
  if (platform !== 'Epic') return { success: false, error: 'Updates only supported for Epic Games' };
  try {
    const output = await exec(`legendary update ${appid} --yes`);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { installGame, updateGame };
