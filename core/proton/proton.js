const fetch = require('node-fetch');
const fs = require('fs').promisify;
const tar = require('tar');
const path = require('path');

const protonDir = path.join(process.env.HOME, '.nova-play', 'protons');

async function getProtons() {
  try {
    const response = await fetch('https://api.github.com/repos/GloriousEggroll/proton-ge-custom/releases');
    const releases = await response.json();
    const localProtons = await fs.readdir(protonDir).catch(() => []);
    return releases.map(release => ({
      version: release.tag_name,
      installed: localProtons.includes(release.tag_name),
      downloadUrl: release.assets[0]?.browser_download_url
    }));
  } catch (error) {
    console.error('Proton fetch error:', error.message);
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
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { getProtons, downloadProton };
