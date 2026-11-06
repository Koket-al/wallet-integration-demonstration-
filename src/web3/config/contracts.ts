import PaymentVaultABI from "../contracts/PaymentVaultABI.json";

export const PAYMENT_VAULT_ABI = PaymentVaultABI;

// Default deployed contract addresses per network (can be overridden via localStorage or env)
export const DEFAULT_CONTRACT_ADDRESSES: Record<number, string> = {
  11155111: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Sepolia Payment Vault
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",    // Hardhat test contract
  1337: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",     // Ganache test contract
  1: "0x0000000000000000000000000000000000000000",        // Placeholder Mainnet
};

export const FALLBACK_DEMO_CONTRACT_ADDRESS = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";

export function getContractAddressForChain(chainId: number | null | undefined): string {
  if (!chainId) return FALLBACK_DEMO_CONTRACT_ADDRESS;
  return DEFAULT_CONTRACT_ADDRESSES[chainId] || FALLBACK_DEMO_CONTRACT_ADDRESS;
}
