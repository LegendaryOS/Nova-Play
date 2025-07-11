const fetch = require('node-fetch');
const fs = require('fs').promisify;
const tar = require('tar');
const path = require('path');
const log = require('electron-log');

const protonDir = path.join(process.env.HOME, '.nova-play', 'protons');

async function getProtons() {
  try {
    const response = await fetch('https://api.github.com/repos/GloriousEggroll/proton-ge-custom/releases');
    const releases = await response.json();
    const localProtons = await fs.readdir(protonDir).catch(() => []);
    const protons = releases.map(release => ({
      version: release.tag_name,
      installed: localProtons.includes(release.tag_name),
      downloadUrl: release.assets[0]?.browser_download_url
    }));
    log.info(`Fetched ${protons.length} Proton versions`);
    return protons;
  } catch (error) {
    log.error(`Proton fetch error: ${error.message}`);
    return [];
  }
}

async function downloadProton(version, url) {
  try {
    const filePath = path.join(protonDir, `${version}.tar.gz`);
    const response = await fetch(url);
    const fileStream = require('fs').createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    await tar.x({ file: filePath, cwd: protonDir });
    await fs.unlink(filePath);
    log.info(`Proton ${version} downloaded and extracted`);
    return { success: true };
  } catch (error) {
    log.error(`Proton download error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = { getProtons, downloadProton };
