const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function getProtonVersions() {
    const protonDir = path.join(process.env.HOME, '.steam/steam/compatibilitytools.d');
    try {
        const files = await fs.readdir(protonDir);
        const versions = files
        .filter(file => file.includes('Proton'))
        .map(file => ({
            name: file,
            path: path.join(protonDir, file, 'proton')
        }));
        return versions.length > 0 ? versions : [{ name: 'No Proton found', path: '' }];
    } catch (error) {
        return [{ name: 'No Proton found', path: '' }];
    }
}

function runGameWithProton(gamePath, protonPath) {
    return new Promise((resolve, reject) => {
        const gameExe = path.join(gamePath, 'game.exe'); // Adjust based on actual game structure
        const prefix = path.join(gamePath, 'prefix');
        const proc = spawn('bash', ['-c', `
        PROTON_USE_WINED3D=1 \
        STEAM_COMPAT_DATA_PATH="${prefix}" \
        "${protonPath}" run "${gameExe}"
        `]);

        proc.stderr.on('data', data => console.error(data.toString()));
        proc.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error('Proton failed to launch game'));
        });
    });
}

module.exports = { runGameWithProton, getProtonVersions };
