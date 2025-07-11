const Sidebar = ({ libraries, loadGames }) => {
  return (
    <div className="sidebar">
      <div className="nova-menu">
        <button id="nova-menu-btn">☰ Nova Play</button>
        <div className="nova-menu-dropdown hidden">
          <button onClick={() => window.electronAPI.invoke('system-action', 'shutdown')}>Shut Down</button>
          <button onClick={() => window.electronAPI.invoke('system-action', 'restart')}>Restart</button>
          <button onClick={() => window.electronAPI.invoke('system-action', 'logout')}>Log Out</button>
          <button onClick={() => window.electronAPI.invoke('system-action', 'quit')}>Quit App</button>
          <button onClick={() => window.electronAPI.invoke('system-action', 'restartApp')}>Restart App</button>
        </div>
      </div>
      <h2>Library</h2>
      <ul id="library-list">
        {libraries.map(lib => (
          <li key={lib.platform} onClick={() => loadGames(lib.platform)}>
            {lib.platform} ({lib.games.length})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
