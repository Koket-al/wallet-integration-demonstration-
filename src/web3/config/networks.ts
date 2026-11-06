import { NetworkInfo } from "../types";

export const SUPPORTED_NETWORKS: Record<number, NetworkInfo> = {
  1: {
    chainId: 1,
    hexChainId: "0x1",
    name: "Ethereum Mainnet",
    shortName: "Mainnet",
    currencySymbol: "ETH",
    rpcUrls: ["https://cloudflare-eth.com"],
    blockExplorerUrls: ["https://etherscan.io"],
    isTestnet: false,
  },
  11155111: {
    chainId: 11155111,
    hexChainId: "0xaa36a7",
    name: "Sepolia Testnet",
    shortName: "Sepolia",
    currencySymbol: "SepoliaETH",
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    isTestnet: true,
  },
  17000: {
    chainId: 17000,
    hexChainId: "0x4268",
    name: "Holesky Testnet",
    shortName: "Holesky",
    currencySymbol: "HolETH",
    rpcUrls: ["https://ethereum-holesky.publicnode.com"],
    blockExplorerUrls: ["https://holesky.etherscan.io"],
    isTestnet: true,
  },
  31337: {
    chainId: 31337,
    hexChainId: "0x7a69",
    name: "Hardhat / Anvil Local",
    shortName: "Localhost 31337",
    currencySymbol: "ETH",
    rpcUrls: ["http://127.0.0.1:8545"],
    blockExplorerUrls: [],
    isTestnet: true,
  },
  1337: {
    chainId: 1337,
    hexChainId: "0x539",
    name: "Ganache Local",
    shortName: "Localhost 1337",
    currencySymbol: "ETH",
    rpcUrls: ["http://127.0.0.1:7545"],
    blockExplorerUrls: [],
    isTestnet: true,
  },
  137: {
    chainId: 137,
    hexChainId: "0x89",
    name: "Polygon Mainnet",
    shortName: "Polygon",
    currencySymbol: "MATIC",
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
    isTestnet: false,
  },
  42161: {
    chainId: 42161,
    hexChainId: "0xa4b1",
    name: "Arbitrum One",
    shortName: "Arbitrum",
    currencySymbol: "ETH",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
    isTestnet: false,
  },
};

export const DEFAULT_CHAIN_ID = 11155111; // Sepolia Testnet default

export function getNetworkInfo(chainId: number | null | undefined): NetworkInfo {
  if (!chainId || !SUPPORTED_NETWORKS[chainId]) {
    return {
      chainId: chainId || 0,
      hexChainId: chainId ? `0x${chainId.toString(16)}` : "0x0",
      name: chainId ? `Chain ID ${chainId}` : "Unknown Network",
      shortName: chainId ? `ID: ${chainId}` : "Unknown",
      currencySymbol: "ETH",
      rpcUrls: [],
      blockExplorerUrls: [],
      isTestnet: true,
    };
  }
  return SUPPORTED_NETWORKS[chainId];
}

export function formatAddress(address: string | null | undefined, chars: number = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function getExplorerTxUrl(chainId: number | null | undefined, txHash: string): string | null {
  if (!chainId || !txHash) return null;
  const network = SUPPORTED_NETWORKS[chainId];
  if (network && network.blockExplorerUrls && network.blockExplorerUrls[0]) {
    return `${network.blockExplorerUrls[0]}/tx/${txHash}`;
  }
  return null;
}

export function getExplorerAddressUrl(chainId: number | null | undefined, address: string): string | null {
  if (!chainId || !address) return null;
  const network = SUPPORTED_NETWORKS[chainId];
  if (network && network.blockExplorerUrls && network.blockExplorerUrls[0]) {
    return `${network.blockExplorerUrls[0]}/address/${address}`;
  }
  return null;
}
