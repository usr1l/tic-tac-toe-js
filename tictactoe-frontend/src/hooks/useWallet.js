import { ethers } from "ethers";
import { TICTACTOEFACTORY_ABI, TICTACTOEFACTORY_ADDRESS } from "../config.js";
import { useEffect, useState } from "react";

export default function useWallet(provider) {
    const [ walletAddress, setWalletAddress ] = useState("");
    const [ signer, setSigner ] = useState(null);
    const [ factoryContract, setFactoryContract ] = useState(null);
    const [ providerInstance, setProviderInstance ] = useState(null);

    useEffect(() => {

        if (!provider) {
            setWalletAddress("");
            setProviderInstance(null);
            setFactoryContract(null);
            setSigner(null);
            return;
        };

        async function connect() {
            try {
                // get the current provider information
                const currProvider = new ethers.BrowserProvider(provider);
                const signer = await currProvider.getSigner();
                const address = await signer.getAddress();
                const contract = new ethers.Contract(TICTACTOEFACTORY_ADDRESS, TICTACTOEFACTORY_ABI, signer);

                setWalletAddress(address);
                setFactoryContract(contract);
                setProviderInstance(currProvider);
                setSigner(signer);
            } catch (e) {
                console.error("Connection failed: ", e)
            }
        }

        connect();

        // listens for evnts from providers when the user account changes
        provider.on("accountsChanged", accounts => {
            if (accounts.length > 0) {
                connect();
            } else {
                setWalletAddress("");
                setSigner(null);
                setFactoryContract(null);
                console.log("User wallet has disconnected");
            }
        });

        return () => {
            provider.removeAllListeners("acccountChanged");
        }

    }, [ provider ])

    return {
        walletAddress,
        factoryContract,
        providerInstance,
        walletConnected: !!contractInstance
    }
}
