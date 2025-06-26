const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const gameList = document.getElementById('game-list');
    const protonSelect = document.getElementById('proton-select');
    const connectWalletBtn = document.getElementById('connect-wallet');
    const walletStatus = document.getElementById('wallet-status');
    const protonManagerList = document.getElementById('proton-manager-list');
    const searchInput = document.getElementById('game-search');
    const platformFilter = document.getElementById('platform-filter');
    const loadingSpinner = document.getElementById('loading-spinner');
    const protonProgress = document.getElementById('proton-progress');
    const errorLog = document.getElementById('error-log');

    function showSpinner() {
        loadingSpinner.classList.remove('hidden');
    }

    function hideSpinner() {
        loadingSpinner.classList.add('hidden');
    }

    function showError(message) {
        errorLog.textContent = `Error: ${message}`;
        errorLog.classList.remove('hidden');
        setTimeout(() => errorLog.classList.add('hidden'), 5000);
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            tab.classList.add('active');
            const content = document.getElementById(tab.dataset.tab);
            content.classList.remove('hidden');
            gsap.from(content, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
            if (tab.dataset.tab === 'web3') loadWeb3Games();
        });
    });

    async function loadProtonVersions() {
        showSpinner();
        try {
            const protonVersions = await ipcRenderer.invoke('get-proton-versions');
            hideSpinner();
            if (protonVersions.error) {
                showError(protonVersions.error);
                return;
            }
            protonSelect.innerHTML = '<option value="">Select Proton Version</option>';
            protonVersions.forEach(version => {
                const option = document.createElement('option');
                option.value = version.path;
                option.textContent = version.name;
                protonSelect.appendChild(option);
            });
        } catch (error) {
            hideSpinner();
            showError('Failed to load Proton versions: ' + error.message);
        }
    }

    async function loadGames() {
        showSpinner();
        try {
            const platform = platformFilter.value;
            const search = searchInput.value;
            const games = await ipcRenderer.invoke('get-games', { platform, search });
            hideSpinner();
            if (games.error) {
                showError(games.error);
                gameList.innerHTML = '<p class="text-center text-gray-400">Failed to load games. Check console or try logging in.</p>';
                return;
            }
            gameList.innerHTML = games.length === 0 ? '<p class="text-center text-gray-400">No games found. Try logging in or installing games.</p>' : '';
            games.forEach(game => {
                const gameCard = document.createElement('div');
                gameCard.className = 'game-card bg-gray-800 p-6 rounded-xl shadow-lg transform transition-all hover:scale-105';
                gameCard.innerHTML = `
                <h3 class="text-xl font-bold text-white">${game.app_name || game.title}</h3>
                <p class="text-sm text-gray-400">Platform: ${game.platform || 'Unknown'}</p>
                <p class="text-sm text-gray-400">Anti-cheat: ${game.anticheat || 'Unknown'}</p>
                ${game.description ? `<p class="text-sm text-gray-500">${game.description}</p>` : ''}
                <button onclick="launchGame('${game.install_path || game.path}')" class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded mt-3">Launch</button>
                `;
                gsap.from(gameCard, { opacity: 0, y: 50, duration: 0.5, ease: 'power2.out', delay: 0.1 * gameList.childElementCount });
                gameList.appendChild(gameCard);
            });
        } catch (error) {
            hideSpinner();
            showError('Failed to load games: ' + error.message);
        }
    }

    async function loadWeb3Games() {
        showSpinner();
        try {
            const games = await ipcRenderer.invoke('get-games', { platform: 'Web3' });
            hideSpinner();
            if (games.error) {
                showError(games.error);
                return;
            }
            const web3Games = document.getElementById('web3-games');
            web3Games.innerHTML = games.length === 0 ? '<p class="text-center text-gray-400">No Web3 games found.</p>' : '';
            games.forEach(game => {
                const gameCard = document.createElement('div');
                gameCard.className = 'game-card bg-gray-800 p-6 rounded-xl shadow-lg transform transition-all hover:scale-105';
                gameCard.innerHTML = `
                <h3 class="text-xl font-bold text-white">${game.title}</h3>
                <p class="text-sm text-gray-400">Platform: ${game.platform}</p>
                <p class="text-sm text-gray-500">${game.description}</p>
                <button onclick="launchGame('${game.path}')" class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded mt-3">Launch</button>
                `;
                gsap.from(gameCard, { opacity: 0, y: 50, duration: 0.5, ease: 'power2.out', delay: 0.1 * web3Games.childElementCount });
                web3Games.appendChild(gameCard);
            });
        } catch (error) {
            hideSpinner();
            showError('Failed to load Web3 games: ' + error.message);
        }
    }

    async function loadProtonManager() {
        showSpinner();
        try {
            const availableProtons = await ipcRenderer.invoke('list-available-protons');
            hideSpinner();
            if (availableProtons.error) {
                showError(availableProtons.error);
                return;
            }
            protonManagerList.innerHTML = '';
            availableProtons.forEach(proton => {
                const protonItem = document.createElement('div');
                protonItem.className = 'proton-item bg-gray-800 p-4 rounded-xl flex justify-between items-center shadow-lg';
                protonItem.innerHTML = `
                <span class="text-white text-lg">${proton.name}</span>
                <div>
                <button onclick="manageProton('install', '${proton.name}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2">Install</button>
                <button onclick="manageProton('remove', '${proton.name}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Remove</button>
                </div>
                `;
                protonManagerList.appendChild(protonItem);
            });
        } catch (error) {
            hideSpinner();
            showError('Failed to load Proton manager: ' + error.message);
        }
    }

    connectWalletBtn.addEventListener('click', async () => {
        const walletType = prompt('Enter wallet type (MetaMask or WalletConnect):');
        if (walletType) {
            showSpinner();
            try {
                const result = await ipcRenderer.invoke('connect-wallet', walletType.toLowerCase());
                hideSpinner();
                if (result.error) {
                    showError(result.error);
                } else {
                    walletStatus.textContent = `Connected: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`;
                    loadWeb3Games();
                }
            } catch (error) {
                hideSpinner();
                showError('Wallet connection failed: ' + error.message);
            }
        }
    });

    document.getElementById('login-epic').addEventListener('click', async () => {
        showSpinner();
        try {
            const result = await ipcRenderer.invoke('login-epic');
            hideSpinner();
            if (result.error) showError(result.error);
            else {
                alert('Epic login successful');
                loadGames();
            }
        } catch (error) {
            hideSpinner();
            showError('Epic login failed: ' + error.message);
        }
    });

    document.getElementById('login-gog').addEventListener('click', async () => {
        showSpinner();
        try {
            const result = await ipcRenderer.invoke('login-gog');
            hideSpinner();
            if (result.error) showError(result.error);
            else {
                alert('GOG login successful');
                loadGames();
            }
        } catch (error) {
            hideSpinner();
            showError('GOG login failed: ' + error.message);
        }
    });

    document.querySelectorAll('.store-link').forEach(link => {
        link.addEventListener('click', () => {
            ipcRenderer.invoke('open-store', link.dataset.store);
        });
    });

    searchInput.addEventListener('input', loadGames);
    platformFilter.addEventListener('change', loadGames);

    ipcRenderer.on('proton-progress', (event, { status }) => {
        protonProgress.textContent = status;
        protonProgress.classList.remove('hidden');
        setTimeout(() => protonProgress.classList.add('hidden'), 3000);
    });

    ipcRenderer.on('error-log', (event, message) => {
        showError(message);
    });

    try {
        await loadProtonVersions();
        await loadGames();
        await loadProtonManager();
    } catch (error) {
        showError('Initialization failed: ' + error.message);
    }
});

async function launchGame(gamePath) {
    if (!document.getElementById('proton-select').value) {
        alert('Please select a Proton version');
        return;
    }
    showSpinner();
    try {
        const protonVersion = document.getElementById('proton-select').value;
        const result = await ipcRenderer.invoke('launch-game', { gamePath, protonVersion });
        hideSpinner();
        if (result.error) {
            showError(result.error);
        }
    } catch (error) {
        hideSpinner();
        showError('Failed to launch game: ' + error.message);
    }
}

async function manageProton(action, version) {
    showSpinner();
    try {
        const result = await ipcRenderer.invoke('manage-proton', { action, version });
        hideSpinner();
        if (result.error) {
            showError(result.error);
        } else {
            await loadProtonVersions();
            await loadProtonManager();
        }
    } catch (error) {
        hideSpinner();
        showError(`Failed to ${action} Proton: ${error.message}`);
    }
}
