import { useState } from 'react';
import { useSyncProviders } from './hooks/useSyncProvider.js';
import WalletProvider from './context/WalletProvider.jsx';
import './App.css';
import Lobby from './components/Game/Lobby.jsx';

function App() {
  const providers = useSyncProviders();
  const [ selectedProvider, setSelectedProvider ] = useState(null);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider.provider);
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
    <WalletProvider selectedProvider={selectedProvider}>
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
            <div>No Announced Wallet. Check if Wallet Extension is Active.</div>
          )}
        </div>
        <Lobby />
      </div>
    </WalletProvider>
  )
}

export default App;
