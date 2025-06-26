const { ipcRenderer } = require('electron');

function performTransaction() {
    alert('Transaction simulation: Sending 0.01 ETH (placeholder)');
}

function closeOverlay() {
    ipcRenderer.send('close-overlay');
}
