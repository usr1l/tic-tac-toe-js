import { useSyncProviders } from './hooks/useSyncProvider.js';
import Game from './components/Game/Game.jsx';
import useWallet from './hooks/useWallet.js';
import { useState } from 'react';
import './App.css';

function App() {
  const providers = useSyncProviders();

  const [ selectedProvider, setSelectedProvider ] = useState(null);
  const {
    walletAddress,
    contractInstance,
    walletConnected
  } = useWallet(selectedProvider ? selectedProvider.provider : null);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  }

  // another way:
  // const handleConnect = async (providerWithInfo) => {
  //   try {
  //     const accounts = await providerWithInfo.provider.request({
  //       method: "eth_requestAccounts"
  //     })
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  return (
    <div className="App">
      <h2>Wallets Detected:</h2>
      <div className="providers">
        {providers.length > 0 ? (
          providers?.map((provider) => (
            <button key={provider.info.uuid} onClick={() => handleProviderSelect(provider)}>
              <img src={provider.info.icon} alt={provider.info.name} />
              <div>{provider.info.name}</div>
            </button>
          ))
        ) : (
          <div>No Announced Wallet</div>
        )}
      </div>
      <Game
        walletAddress={walletAddress}
        contractInstance={contractInstance}
        walletConnected={walletConnected}
      />
    </div>
  )
}

export default App;
