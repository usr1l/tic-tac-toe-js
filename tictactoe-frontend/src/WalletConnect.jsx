import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnect() {
    const { address, isConnected } = useAccount.read();

    const { connectors, connect } = useConnect();
    const { disconnect } = useDisconnect();

    if (!isConnected) {
        const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    };

    return (
        <div styl={{ padding: '10px', border: '1px solid green', borderRadius: '5px', margin: '10px 0' }}>
            {connectors.map((connector) => {
                <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    disabled={connector.uid === 'injected' && !connector.ready}
                    style={{ padding: '10px', margin: '5px', cursor: 'pointer' }}
                >
                    connect with {connector.name}
                </button>
            })}
        </div>
    )
}
