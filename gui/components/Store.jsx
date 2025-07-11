const Store = () => {
  const loadStore = url => {
    document.getElementById('store-webview').src = url;
  };

  return (
    <div id="store" className="tab-content">
      <h2>Store</h2>
      <div className="store-list">
        <button onClick={() => loadStore('https://store.epicgames.com')}>Epic Games Store</button>
        <button onClick={() => loadStore('https://www.ea.com/games')}>EA Store</button>
        <button onClick={() => loadStore('https://store.steampowered.com')}>Steam Store</button>
        <button onClick={() => loadStore('https://www.gog.com')}>GOG Shop</button>
        <button onClick={() => loadStore('https://hyperplay.xyz')}>HyperPlay Shop</button>
      </div>
      <webview id="store-webview" className="store-webview" src=""></webview>
    </div>
  );
};

export default Store;
