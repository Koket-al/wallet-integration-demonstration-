// Web3 Context and Hooks
export { Web3Provider, useWeb3 } from "./context/Web3Context";
export type { Web3ContextType } from "./context/Web3Context";
export { usePaymentVault } from "./hooks/usePaymentVault";

// UI Components
export { WalletConnectButton } from "./components/WalletConnectButton";
export { WalletDetailsModal } from "./components/WalletDetailsModal";
export { PaymentVaultCard } from "./components/PaymentVaultCard";

// Services & Config
export { EthereumService } from "./services/ethereumService";
export { ContractService } from "./services/contractService";
export { MockContractService } from "./services/mockContractService";
export { SUPPORTED_NETWORKS, getNetworkInfo, formatAddress } from "./config/networks";
export { PAYMENT_VAULT_ABI, DEFAULT_CONTRACT_ADDRESSES } from "./config/contracts";

// Types
export * from "./types";
