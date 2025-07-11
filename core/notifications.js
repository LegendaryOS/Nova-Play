const axios = require('axios');
const log = require('electron-log');

async function getNotifications() {
  try {
    const epicPromos = await axios.get('https://store.epicgames.com/en-US/api/freeGamesPromotions').catch(() => ({ data: { freeGames: [] } }));
    const notifications = [
      { platform: 'Epic', message: 'Free game available!', data: epicPromos.data },
      { platform: 'Steam', message: 'Check Steam Summer Sale!', data: {} },
      { platform: 'EA', message: 'Check EA Store for deals!', data: {} },
      { platform: 'HyperPlay', message: 'New Web3 games available!', data: {} }
    ];
    log.info(`Fetched ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    log.error(`Notifications error: ${error.message}`);
    return [];
  }
}

module.exports = { getNotifications };
