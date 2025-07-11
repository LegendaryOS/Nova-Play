function renderLibraryList(libraries, loadGames) {
  const libraryList = document.getElementById('library-list');
  libraryList.innerHTML = libraries.map(lib => `
    <li onclick="loadGames('${lib.platform}')">${lib.platform} (${lib.games.length})</li>
  `).join('');
}
