const { spawn } = require('child_process');
const { shell } = require('electron');
const fs = require('fs').promises;
const { logError } = require('./debug');

async function checkGogdl() {
    try {
        await fs.access('/usr/bin/gogdl');
        return true;
    } catch {
        throw new Error('gogdl CLI not found. Install it via Heroic Games Launcher tools.');
    }
}

function listGogGames() {
    return new Promise((resolve, reject) => {
        checkGogdl().then(() => {
            const proc = spawn('gogdl', ['--auth-config-path', `${process.env.HOME}/.config/heroic/gog_store/auth.json`, 'list']);
            let output = '';
            proc.stdout.on('data', data => output += data.toString());
            proc.stderr.on('data', data => logError('gogdl error: ' + data.toString()));
            proc.on('close', code => {
                if (code === 0) {
                    // Mock parsing; replace with actual gogdl JSON parsing
                    const games = [
                        { title: 'The Witcher 3: Wild Hunt', path: '/path/to/witcher3', platform: 'GOG', anticheat: 'None', description: 'An epic RPG adventure' },
                        { title: 'Cyberpunk 2077', path: '/path/to/cyberpunk', platform: 'GOG', anticheat: 'None', description: 'A futuristic open-world RPG' }
                    ];
                    resolve(JSON.stringify(games));
                } else {
                    reject(new Error('Failed to fetch GOG games. Ensure gogdl is authenticated.'));
                }
            });
        }).catch(error => {
            logError(error.message);
            reject(error);
        });
    });
}

function loginGog() {
    return new Promise((resolve, reject) => {
        checkGogdl().then(() => {
            const proc = spawn('gogdl', ['--auth-config-path', `${process.env.HOME}/.config/heroic/gog_store/auth.json`, 'auth']);
            let output = '';
            proc.stderr.on('data', data => {
                output += data.toString();
                if (output.includes('authentication required')) {
                    shell.openExternal('https://www.gog.com/en/account');
                }
            });
            proc.on('close', code => {
                if (code === 0 || output.includes('authentication required')) resolve();
                else {
                    logError('GOG login failed: ' + output);
                    reject(new Error('GOG login failed: ' + output));
                }
            });
        }).catch(error => {
            logError(error.message);
            reject(error);
        });
    });
}

module.exports = { listGogGames, loginGog };
