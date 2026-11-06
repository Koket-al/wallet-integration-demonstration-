export type NetworkInfo = {
  chainId: number;
  hexChainId: string;
  name: string;
  shortName: string;
  currencySymbol: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  isTestnet: boolean;
};

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export type WalletState = {
  status: WalletStatus;
  account: string | null;
  chainId: number | null;
  networkName: string;
  balance: string; // in ETH
  isMetaMaskInstalled: boolean;
  error: string | null;
};

export type TransactionStatus = "idle" | "preparing" | "pending" | "confirmed" | "failed";

export type TransactionType = "deposit" | "withdraw";

export type TransactionRecord = {
  id: string;
  hash: string;
  type: TransactionType;
  amount: string; // in ETH
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  error?: string;
  blockNumber?: number;
  isMock: boolean;
};

export type VaultState = {
  contractBalance: string; // Total ETH in contract
  userVaultBalance: string; // User's deposited ETH in vault
  isLoading: boolean;
  txStatus: TransactionStatus;
  activeTxHash: string | null;
  error: string | null;
  successMessage: string | null;
  isMockMode: boolean;
  contractAddress: string;
};
