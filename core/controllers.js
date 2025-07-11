const { exec } = require('child_process').promisify;

async function detectControllers() {
  try {
    const output = await exec('ls /dev/input/js*');
    return output.split('\n').map(device => ({
      id: device,
      name: `Controller ${device}`,
      mappings: {} // Add mapping logic if needed
    }));
  } catch (error) {
    console.error('Controller detection error:', error.message);
    return [];
  }
}

module.exports = { detectControllers };
