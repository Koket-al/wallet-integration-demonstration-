import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { WalletState, WalletStatus, NetworkInfo } from "../types";
import { EthereumService } from "../services/ethereumService";
import { getNetworkInfo } from "../config/networks";

export interface Web3ContextType extends WalletState {
  networkInfo: NetworkInfo;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>("0.0");
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false);

  // Check if MetaMask is installed on mount
  useEffect(() => {
    const installed = EthereumService.isMetaMaskInstalled();
    setIsMetaMaskInstalled(installed);
  }, []);

  const networkInfo = getNetworkInfo(chainId);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateAccountBalance = useCallback(async (userAccount: string) => {
    try {
      const bal = await EthereumService.getBalance(userAccount);
      setBalance(parseFloat(bal).toFixed(4));
    } catch {
      setBalance("0.0000");
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (account) {
      await updateAccountBalance(account);
    }
  }, [account, updateAccountBalance]);

  // Connect wallet handler
  const connectWallet = useCallback(async () => {
    if (!EthereumService.isMetaMaskInstalled()) {
      const msg = "MetaMask is not detected. Please install the MetaMask extension from metamask.io.";
      setError(msg);
      setStatus("error");
      return;
    }

    try {
      setStatus("connecting");
      setError(null);

      const accounts = await EthereumService.requestAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your MetaMask wallet.");
      }

      const activeAccount = accounts[0];
      const activeChainId = await EthereumService.getChainId();

      setAccount(activeAccount);
      setChainId(activeChainId);
      setStatus("connected");
      setError(null);

      await updateAccountBalance(activeAccount);
    } catch (err: any) {
      console.warn("Wallet connection error:", err);
      const friendlyError = EthereumService.parseError(err).message;
      setError(friendlyError);
      setStatus("error");
    }
  }, [updateAccountBalance]);

  // Disconnect wallet handler (client-side state reset)
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalance("0.0");
    setStatus("disconnected");
    setError(null);
  }, []);

  // Switch network handler
  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      try {
        setError(null);
        await EthereumService.switchNetwork(targetChainId);
        const currentChain = await EthereumService.getChainId();
        setChainId(currentChain);
        if (account) {
          await updateAccountBalance(account);
        }
      } catch (err: any) {
        const friendlyError = EthereumService.parseError(err).message;
        setError(friendlyError);
        throw err;
      }
    },
    [account, updateAccountBalance]
  );

  // Silent check on initial mount: check if wallet is already authorized without popups
  useEffect(() => {
    if (!EthereumService.isMetaMaskInstalled()) return;

    let isMounted = true;

    async function checkExistingConnection() {
      try {
        const accounts = await EthereumService.getAuthorizedAccounts();
        if (accounts.length > 0 && isMounted) {
          const currentAccount = accounts[0];
          const currentChainId = await EthereumService.getChainId();

          setAccount(currentAccount);
          setChainId(currentChainId);
          setStatus("connected");

          const bal = await EthereumService.getBalance(currentAccount);
          if (isMounted) {
            setBalance(parseFloat(bal).toFixed(4));
          }
        }
      } catch (err) {
        // Silent failure on background check - don't show error
        console.debug("Silent wallet authorization check:", err);
      }
    }

    checkExistingConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to MetaMask provider events
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        // User locked or disconnected wallet in MetaMask
        disconnectWallet();
      } else {
        const newAccount = accounts[0];
        setAccount(newAccount);
        setStatus("connected");
        setError(null);
        updateAccountBalance(newAccount);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      setError(null);
      if (account) {
        updateAccountBalance(account);
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [account, disconnectWallet, updateAccountBalance]);

  const value: Web3ContextType = {
    status,
    account,
    chainId,
    networkName: networkInfo.name,
    balance,
    isMetaMaskInstalled,
    error,
    networkInfo,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance,
    clearError,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
