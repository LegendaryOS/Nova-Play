let currentPlatform;

function showAuthModal(platform) {
  currentPlatform = platform;
  document.getElementById('login-platform').textContent = platform;
  document.getElementById('login-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('login-modal').classList.add('hidden');
}
