const { spawn } = require('child_process');
const { shell } = require('electron');
const fs = require('fs').promises;
const { logError } = require('./debug');

async function checkLegendary() {
    try {
        await fs.access('/usr/bin/legendary');
        return true;
    } catch {
        throw new Error('Legendary CLI not found. Install it via `pip install legendary-gl`.');
    }
}

function listEpicGames() {
    return new Promise((resolve, reject) => {
        checkLegendary().then(() => {
            const proc = spawn('legendary', ['list-installed', '--json']);
            let output = '';
            proc.stdout.on('data', data => output += data.toString());
            proc.stderr.on('data', data => logError('Legendary error: ' + data.toString()));
            proc.on('close', code => {
                if (code === 0) {
                    try {
                        const games = JSON.parse(output).map(game => ({
                            ...game,
                            platform: 'Epic',
                            anticheat: 'Unknown', // TODO: Integrate with areweanticheatyet.com
                        }));
                        resolve(JSON.stringify(games));
                    } catch (error) {
                        reject(new Error('Failed to parse Epic games: ' + error.message));
                    }
                } else {
                    reject(new Error('Failed to fetch Epic games. Ensure Legendary is authenticated.'));
                }
            });
        }).catch(error => {
            logError(error.message);
            reject(error);
        });
    });
}

function loginEpic() {
    return new Promise((resolve, reject) => {
        checkLegendary().then(() => {
            const proc = spawn('legendary', ['auth']);
            let output = '';
            proc.stderr.on('data', data => {
                output += data.toString();
                if (output.includes('Please login via the Epic Games website')) {
                    shell.openExternal('https://www.epicgames.com/id/login');
                }
            });
            proc.on('close', code => {
                if (code === 0 || output.includes('Please login')) resolve();
                else {
                    logError('Epic login failed: ' + output);
                    reject(new Error('Epic login failed: ' + output));
                }
            });
        }).catch(error => {
            logError(error.message);
            reject(error);
        });
    });
}

module.exports = { listEpicGames, loginEpic };
