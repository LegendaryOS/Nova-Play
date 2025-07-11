function renderGameCard(game, protonVersion) {
  return `
    <div class="game-card">
      <img src="${game.icon}" alt="${game.title}" onerror="this.src='assets/default.png'">
      <div class="game-card-content">
        <h3>${game.title}</h3>
        <p>Status: ${game.installed ? 'Installed' : 'Not Installed'}</p>
        ${game.playtime ? `<p>Playtime: ${Math.floor(game.playtime / 60)}h ${game.playtime % 60}m</p>` : ''}
        <button onclick="launchGame('${game.appid}', '${game.platform}', '${protonVersion}')">
          Launch${protonVersion ? ` with ${protonVersion}` : ''}
        </button>
      </div>
    </div>
  `;
}
