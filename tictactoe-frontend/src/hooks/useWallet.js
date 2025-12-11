import { ethers } from "ethers";
import { TICTACTOEFACTORY_ABI, TICTACTOEFACTORY_ADDRESS } from "../config.js";
import { useEffect, useState } from "react";

export default function useWallet(provider) {
    const [ walletAddress, setWalletAddress ] = useState("");
    const [ contractInstance, setContractInstance ] = useState(null);

    useEffect(() => {

        if (!provider) {
            setWalletAddress("");
            setContractInstance(null);
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
                setContractInstance(contract);
            } catch (e) {
                console.error("Connection failed: ", e)
            }
        }

        connect();
    }, [ provider ])

    return {
        walletAddress,
        contractInstance,
        walletConnected: !!contractInstance
    }
}
