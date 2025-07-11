function renderGameCard(game, protonVersions, defaultProton) {
  return `
    <div class="game-card">
      <img src="${game.icon}" alt="${game.title}" onerror="this.src='assets/default.png'">
      <div class="game-card-content">
        <h3>${game.title}</h3>
        <p>Status: ${game.installed ? 'Installed' : 'Not Installed'}</p>
        ${game.playtime ? `<p>Playtime: ${Math.floor(game.playtime / 60)}h ${game.playtime % 60}m</p>` : ''}
        ${game.achievements.length ? `<p>Achievements: ${game.achievements.filter(a => a.achieved).length}/${game.achievements.length}</p>` : ''}
        <select onchange="updateGameOptions('${game.appid}', this.value)">
          <option value="">Default (${defaultProton || 'None'})</option>
          <option value="native">Native/Wine</option>
          ${protonVersions.filter(p => p.installed).map(p => `<option value="${p.version}">${p.version}</option>`).join('')}
        </select>
        <input type="text" placeholder="Launch options" onblur="updateGameOptions('${game.appid}', null, this.value)">
        <button onclick="launchGame('${game.appid}', '${game.platform}')">Launch</button>
        ${!game.installed ? `<button onclick="installGame('${game.appid}', '${game.platform}')">Install</button>` : `<button onclick="updateGame('${game.appid}', '${game.platform}')">Update</button>`}
      </div>
    </div>
  `;
}
