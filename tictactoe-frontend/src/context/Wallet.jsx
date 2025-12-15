import { useState, useContext, createContext, useEffect } from "react";


const WalletProviderContext = createContext(null);
console.log(WalletProviderContext, "this")

export function WalletProvider({ children }) {
    const [ walletAddress, setWalletAddress ] = useState("");
    const [ signer, setSigner ] = useState(null);
    const [ factoryContract, setFactoryContract ] = useState(null);
    const [ allProviders, setAllProviders ] = useState(null);
    const [ currSelectedProvider, setCurrSelectedProvider ] = useState(null);


    useEffect(() => {
        // if (!selectedProvider) {
        //     setWalletAddress("");
        //     setFactoryContract(null);
        //     setSigner(null);
        //     return;
        // };

        console.log(currSelectedProvider)
    }, [ currSelectedProvider ]);

    const contextValue = {
        // walletAddress,
        // signer,
        // factoryContract,
        // allProviders,
        setCurrSelectedProvider,
        // walletConnected: !!walletAddress,
        // setAllProviders,
    }

    return (
        <WalletProviderContext.Provider value={contextValue}>
            {children}
        </WalletProviderContext.Provider>
    )
};

export const useWalletProvider = () => useContext(WalletProviderContext);
