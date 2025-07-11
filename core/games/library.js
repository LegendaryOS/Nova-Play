const axios = require('axios');
const { exec } = require('child_process').promisify;
const { loadSettings } = require('../config');

async function getLibraries() {
  const settings = loadSettings();
  const libraries = [
    { platform: 'Steam', games: await getSteamGames(settings.steamApiKey, settings.steamId) },
    { platform: 'Epic', games: await getEpicGames(settings.epicAccounts) },
    { platform: 'GOG', games: await getGOGGames() },
    { platform: 'itch.io', games: await getItchGames(settings.itchApiKey) },
    { platform: 'Web3', games: await getWeb3Games() }
  ];
  return libraries.filter(lib => lib.games.length > 0);
}

async function getSteamGames(apiKey, steamId) {
  if (!apiKey || !steamId) return [];
  try {
    const gamesResponse = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true`
    );
    const games = gamesResponse.data.response.games;
    const achievements = await Promise.all(games.map(async game => {
      const achResponse = await axios.get(
        `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${apiKey}&steamid=${steamId}&appid=${game.appid}`
      );
      return { appid: game.appid, achievements: achResponse.data.playerstats.achievements || [] };
    }));
    
    return games.map(game => ({
      id: game.appid,
      title: game.name,
      installed: false,
      icon: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/capsule_184x69.jpg`,
      appid: game.appid.toString(),
      playtime: game.playtime_forever,
      platform: 'Steam',
      achievements: achievements.find(a => a.appid === game.appid)?.achievements || []
    }));
  } catch (error) {
    console.error('Steam error:', error.message);
    return [];
  }
}

async function getEpicGames(accounts) {
  try {
    let allGames = [];
    for (const account of accounts.length ? accounts : ['default']) {
      if (accounts.length) await exec(`legendary auth --account ${account}`);
      const output = await exec('legendary list-games --json');
      const games = JSON.parse(output);
      allGames = allGames.concat(games.map(game => ({
        id: game.app_name,
        title: game.app_title,
        installed: game.is_installed,
        icon: game.metadata?.keyImages?.find(img => img.type === 'Thumbnail')?.url || 'default.png',
        appid: game.app_name,
        playtime: 0, // Legendary doesn't provide playtime
        platform: 'Epic',
        achievements: [], // Epic API for achievements not publicly available
        account: account
      })));
    }
    return allGames;
  } catch (error) {
    console.error('Epic Games error:', error.message);
    return [];
  }
}

async function getGOGGames() {
  return [
    { id: 'witcher3', title: 'The Witcher 3', installed: true, icon: 'witcher3.png', appid: 'witcher3', playtime: 0, platform: 'GOG', achievements: [] }
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
      platform: 'itch.io',
      achievements: []
    }));
  } catch (error) {
    console.error('itch.io error:', error.message);
    return [];
  }
}

async function getWeb3Games() {
  return [
    { id: 'crypto1', title: 'Crypto Game', installed: false, icon: 'crypto.png', appid: 'crypto1', playtime: 0, platform: 'Web3', achievements: [] }
  ];
}

module.exports = { getLibraries };
