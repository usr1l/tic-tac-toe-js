
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { metaMask, injected } from 'wagmi/connectors';
import './App.css';

const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
const rpcUrl = alchemyId ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyId}` : 'https://sepolia.drpc.org';

// manual wagmi condig
const config = createConfig({
  chains: [ sepolia ],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [ sepolia.id ]: http(rpcUrl)
  }
})

// setup react query client
const queryClient = new QueryClient();



function App() {

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div>
          This is react
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
