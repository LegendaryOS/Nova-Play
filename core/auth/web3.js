async function web3Auth() {
  // Web3 authentication handled in renderer (MetaMask)
  return { success: true, token: 'web3-token' };
}

module.exports = { web3Auth };
