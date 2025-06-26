const { ipcMain } = require('electron');

function logError(message) {
    console.error('[ERROR]', message);
    // Optionally send to renderer for UI display
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
        mainWindow.webContents.send('error-log', message);
    }
}

module.exports = { logError };
