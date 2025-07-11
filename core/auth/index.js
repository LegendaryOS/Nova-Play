const { steamAuth } = require('./steam');
const { epicAuth } = require('./epic');
const { gogAuth } = require('./gog');
const { itchAuth } = require('./itch');
const { web3Auth } = require('./web3');

async function authPlatform(platform) {
  try {
    switch (platform) {
      case 'Steam': return await steamAuth();
      case 'Epic': return await epicAuth();
      case 'GOG': return await gogAuth();
      case 'itch.io': return await itchAuth();
      case 'Web3': return await web3Auth();
      default: throw new Error('Unsupported platform');
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { authPlatform };
