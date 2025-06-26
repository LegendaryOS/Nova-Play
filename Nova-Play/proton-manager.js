const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { logError } = require('./debug');

async function listAvailableProtons() {
    return new Promise((resolve, reject) => {
        https.get('https://api.github.com/repos/GloriousEggroll/proton-ge-custom/releases', {
            headers: { 'User-Agent': 'Nova-Launcher' }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const releases = JSON.parse(data).map(release => ({
                        name: release.tag_name,
                        url: release.assets.find(asset => asset.name.endsWith('.tar.gz'))?.browser_download_url
                    })).filter(release => release.url);
                    resolve(releases.slice(0, 5));
                } catch (error) {
                    logError('Failed to parse Proton releases: ' + error.message);
                    reject(new Error('Failed to parse Proton releases: ' + error.message));
                }
            });
        }).on('error', err => {
            logError('Failed to fetch Proton releases: ' + err.message);
            reject(new Error('Failed to fetch Proton releases: ' + err.message));
        });
    });
}

async function installProton(version) {
    const protonDir = path.join(process.env.HOME, '.steam/steam/compatibilitytools.d');
    const protons = await listAvailableProtons();
    const proton = protons.find(p => p.name === version);
    if (!proton) {
        logError('Proton version not found: ' + version);
        throw new Error('Proton version not found');
    }

    try {
        await fs.mkdir(protonDir, { recursive: true });
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(`${version}.tar.gz`);
            https.get(proton.url, response => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    const proc = spawn('tar', ['-xf', `${version}.tar.gz`, '-C', protonDir]);
                    proc.on('close', code => {
                        if (code === 0) {
                            fs.unlink(`${version}.tar.gz`).catch(err => logError('Failed to delete temp file: ' + err.message));
                            resolve();
                        } else {
                            logError('Proton installation failed for ' + version);
                            reject(new Error('Proton installation failed'));
                        }
                    });
                });
            }).on('error', err => {
                logError('Download failed for ' + version + ': ' + err.message);
                reject(new Error('Download failed: ' + err.message));
            });
        });
    } catch (error) {
        logError('Proton installation failed: ' + error.message);
        throw new Error('Proton installation failed: ' + error.message);
    }
}

async function removeProton(version) {
    const protonDir = path.join(process.env.HOME, '.steam/steam/compatibilitytools.d', version);
    try {
        await fs.rm(protonDir, { recursive: true, force: true });
    } catch (error) {
        logError('Proton removal failed: ' + error.message);
        throw new Error('Proton removal failed: ' + error.message);
    }
}

module.exports = { installProton, removeProton, listAvailableProtons };
