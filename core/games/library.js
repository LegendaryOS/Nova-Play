const axios = require('axios');
const { exec } = require('child_process').promisify;
const { loadSettings } = require('../config');

async function getLibraries() {
  const settings = loadSettings();
  const libraries = [
    { platform: 'Steam', games: await getSteamGames(settings.steamApiKey, settings.steamId) },
    { platform: 'Epic', games: await getEpicGames() },
    { platform: 'GOG', games: await getGOGGames() },
    { platform: 'itch.io', games: await getItchGames(settings.itchApiKey) },
    { platform: 'Web3', games: await getWeb3Games() }
  ];
  return libraries.filter(lib => lib.games.length > 0);
}

async function getSteamGames(apiKey, steamId) {
  if (!apiKey || !steamId) return [];
  try {
    const response = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true`
    );
    return response.data.response.games.map(game => ({
      id: game.appid,
      title: game.name,
      installed: false, // Check local Steam installation
      icon: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/capsule_184x69.jpg`,
      appid: game.appid.toString(),
      playtime: game.playtime_forever,
      platform: 'Steam'
    }));
  } catch (error) {
    console.error('Steam error:', error.message);
    return [];
  }
}

async function getEpicGames() {
  try {
    const output = await exec('legendary list-games --json');
    const games = JSON.parse(output);
    return games.map(game => ({
      id: game.app_name,
      title: game.app_title,
      installed: game.is_installed,
      icon: game.metadata?.keyImages?.find(img => img.type === 'Thumbnail')?.url || 'default.png',
      appid: game.app_name,
      playtime: 0, // Legendary doesn't provide playtime
      platform: 'Epic'
    }));
  } catch (error) {
    console.error('Epic Games error:', error.message);
    return [];
  }
}

async function getGOGGames() {
  // Mocked (replace with GOG Galaxy integration)
  return [
    { id: 'witcher3', title: 'The Witcher 3', installed: true, icon: 'witcher3.png', appid: 'witcher3', playtime: 0, platform: 'GOG' }
  ];
}

async function getItchGames(apiKey) {
  if (!apiKey) return [];
  try {
    const response = await axios.get('https://api.itch.io/profile/owned-keys', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return response.data.owned_keys.map(game => ({
      id: game.game.id,
      title: game.game.title,
      installed: false,
      icon: game.game.cover_image || 'default.png',
      appid: game.game.id.toString(),
      playtime: 0,
      platform: 'itch.io'
    }));
  } catch (error) {
    console.error('itch.io error:', error.message);
    return [];
  }
}

async function getWeb3Games() {
  // Mocked (replace with blockchain API)
  return [
    { id: 'crypto1', title: 'Crypto Game', installed: false, icon: 'crypto.png', appid: 'crypto1', playtime: 0, platform: 'Web3' }
  ];
}

module.exports = { getLibraries };
