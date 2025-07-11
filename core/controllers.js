const { exec } = require('child_process').promisify;
const log = require('electron-log');

async function detectControllers() {
  try {
    const output = await exec('ls /dev/input/js*');
    const controllers = output.split('\n').map(device => ({
      id: device,
      name: `Controller ${device}`,
      mappings: {} // SDL2 mappings placeholder
    }));
    log.info(`Detected ${controllers.length} controllers`);
    return controllers;
  } catch (error) {
    log.error(`Controller detection error: ${error.message}`);
    return [];
  }
}

module.exports = { detectControllers };
