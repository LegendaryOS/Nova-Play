const axios = require('axios');

async function getNotifications() {
  try {
    // Mocked Epic Store promotions (replace with real Epic API if available)
    const epicPromos = await axios.get('https://store.epicgames.com/en-US/api/freeGamesPromotions');
    return [
      { platform: 'Epic', message: 'Free game available!', data: epicPromos.data },
      { platform: 'Steam', message: 'Check Steam Summer Sale!', data: {} }
    ];
  } catch (error) {
    console.error('Notifications error:', error.message);
    return [];
  }
}

module.exports = { getNotifications };
