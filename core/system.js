const { exec } = require('child_process').promisify;

async function systemAction(action) {
  const actions = {
    shutdown: 'systemctl poweroff',
    restart: 'systemctl reboot',
    logout: 'loginctl terminate-user $USER',
    quit: () => require('electron').app.quit(),
    restartApp: () => {
      require('electron').app.relaunch();
      require('electron').app.quit();
    }
  };

  if (actions[action]) {
    if (typeof actions[action] === 'function') {
      actions[action]();
      return { success: true };
    }
    try {
      await exec(actions[action]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Invalid action' };
}

module.exports = { systemAction };
