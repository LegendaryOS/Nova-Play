const { exec } = require('child_process').promisify;

async function epicAuth() {
  try {
    const output = await exec('legendary auth');
    return { success: output.includes('Successfully logged in'), token: 'legendary' };
  } catch (error) {
    throw new Error('Epic Games authentication failed: ' + error.message);
  }
}

module.exports = { epicAuth };
