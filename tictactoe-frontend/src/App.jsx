import { useSyncProviders } from './hooks/useSyncProvider.js';
// import { TICTACTOE_ABI, TICTACTOE_ADDRESS, SEPOLIA_CHAIN_ID } from './config.js';
import './App.css';

function App() {
  const providers = useSyncProviders();

  const handleConnect = async (providerWithInfo) => {
    try {
      const accounts = await providerWithInfo.provider.request({
        method: "eth_requestAccounts"
      })
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="App">
      <h2>Wallets Detected:</h2>
      <div className="providers">
        {providers.length > 0 ? (
          providers?.map((provider) => (
            <button key={provider.info.uuid} onClick={() => handleConnect(provider)}>
              <img src={provider.info.icon} alt={provider.info.name} />
              <div>{provider.info.name}</div>
            </button>
          ))
        ) : (
          <div>No Announced Wallet</div>
        )}
      </div>
    </div>
  )
}

export default App;
