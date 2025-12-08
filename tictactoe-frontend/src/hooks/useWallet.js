import { ethers } from "ethers";
import { TICTACTOE_ABI, TICTACTOE_ADDRESS } from "../config.js";
import { useEffect, useState } from "react";

export function useWallet(provider) {
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
                // get the current provider iformation
                const currProvider = new ethers.BrowserProvider(provider.provider);
                const signer = await currProvider.getSigner();
                const address = await signer.getAddress();
                console.log(signer, address);
                const contract = new ethers.Contract(TICTACTOE_ADDRESS, TICTACTOE_ABI, signer);

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
