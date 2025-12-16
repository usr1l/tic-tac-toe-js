import useWallet from "../hooks/useWallet";
import { WalletProviderContext } from "./useWalletProvider";

export default function WalletProvider({ children, selectedProvider }) {
    const { walletAddress, signer, factoryContract, walletConnected } = useWallet(selectedProvider ? selectedProvider : null);

    const contextValue = {
        walletAddress,
        signer,
        factoryContract,
        walletConnected
    }
    return (
        <WalletProviderContext.Provider value={contextValue}>
            {children}
        </WalletProviderContext.Provider>
    )
};
