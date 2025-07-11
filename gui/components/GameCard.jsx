import { motion } from 'framer-motion';

const GameCard = ({ game, protonVersions, defaultProton, onLaunch, onInstall, onUpdate, onOptionsChange }) => {
  return (
    <motion.div
      className="game-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <img src={game.icon} alt={game.title} onError={e => (e.target.src = 'assets/default.png')} />
      <div className="game-card-content">
        <h3>{game.title}</h3>
        <p>Platform: {game.platform}{game.account ? ` (${game.account})` : ''}</p>
        <p>Status: {game.installed ? 'Installed' : 'Not Installed'}</p>
        {game.playtime ? <p>Playtime: {Math.floor(game.playtime / 60)}h {game.playtime % 60}m</p> : null}
        {game.lastPlayed ? <p>Last Played: {new Date(game.lastPlayed * 1000).toLocaleDateString()}</p> : null}
        {game.achievements.length ? (
          <p>Achievements: {game.achievements.filter(a => a.achieved).length}/{game.achievements.length}</p>
        ) : null}
        {game.dlc.length ? <p>DLC: {game.dlc.map(d => d.title).join(', ')}</p> : null}
        <select onChange={e => onOptionsChange(game.appid, e.target.value)}>
          <option value="">Default ({defaultProton || 'None'})</option>
          <option value="native">Native/Wine</option>
          {protonVersions.filter(p => p.installed).map(p => (
            <option key={p.version} value={p.version}>{p.version}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Launch options"
          onBlur={e => onOptionsChange(game.appid, null, e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            onChange={e => onOptionsChange(game.appid, null, null, e.target.checked)}
          /> Offline Mode
        </label>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onLaunch(game.appid, game.platform)}
        >
          Launch
        </motion.button>
        {game.installed ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onUpdate(game.appid, game.platform)}
          >
            Update
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onInstall(game.appid, game.platform)}
          >
            Install
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default GameCard;
