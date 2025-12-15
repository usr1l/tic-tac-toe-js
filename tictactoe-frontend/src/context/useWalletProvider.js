import { createContext, useContext } from "react";

export const WalletProviderContext = createContext(null);

export const useWalletProvider = () => useContext(WalletProviderContext);
