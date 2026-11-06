import { ethers } from "ethers";
import { SUPPORTED_NETWORKS } from "../config/networks";

export class EthereumService {
  private static providerInstance: ethers.providers.Web3Provider | null = null;

  public static isMetaMaskInstalled(): boolean {
    return typeof window !== "undefined" && Boolean(window.ethereum);
  }

  public static getProvider(): ethers.providers.Web3Provider | null {
    if (!this.isMetaMaskInstalled()) return null;
    if (!this.providerInstance && window.ethereum) {
      this.providerInstance = new ethers.providers.Web3Provider(window.ethereum as any, "any");
    }
    return this.providerInstance;
  }

  public static async getSigner(): Promise<ethers.Signer | null> {
    const provider = this.getProvider();
    if (!provider) return null;
    try {
      return provider.getSigner();
    } catch {
      return null;
    }
  }

  /**
   * Request account connection via MetaMask.
   * Prompts user with MetaMask pop-up.
   */
  public static async requestAccounts(): Promise<string[]> {
    if (!this.isMetaMaskInstalled() || !window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return accounts as string[];
    } catch (error: any) {
      throw this.parseError(error);
    }
  }

  /**
   * Silently check for existing authorized accounts without triggering a pop-up.
   */
  public static async getAuthorizedAccounts(): Promise<string[]> {
    if (!this.isMetaMaskInstalled() || !window.ethereum) return [];
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      return accounts as string[];
    } catch {
      return [];
    }
  }

  /**
   * Get current network chain ID.
   */
  public static async getChainId(): Promise<number> {
    if (!this.isMetaMaskInstalled() || !window.ethereum) {
      throw new Error("MetaMask provider is not available.");
    }
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    return parseInt(chainIdHex, 16);
  }

  /**
   * Get user's ETH balance in standard decimal string (e.g., "1.452").
   */
  public static async getBalance(account: string): Promise<string> {
    const provider = this.getProvider();
    if (!provider || !account) return "0.0";
    try {
      const rawBalance = await provider.getBalance(account);
      return ethers.utils.formatEther(rawBalance);
    } catch (error) {
      console.warn("Failed to fetch account balance:", error);
      return "0.0";
    }
  }

  /**
   * Prompt user to switch networks.
   * Requires explicit user approval through MetaMask.
   */
  public static async switchNetwork(targetChainId: number): Promise<void> {
    if (!this.isMetaMaskInstalled() || !window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    const network = SUPPORTED_NETWORKS[targetChainId];
    if (!network) {
      throw new Error(`Chain ID ${targetChainId} is not configured.`);
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.hexChainId }],
      });
    } catch (switchError: any) {
      // Error code 4902 indicates chain has not been added to MetaMask
      if (switchError.code === 4902 && network.rpcUrls.length > 0) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.hexChainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.currencySymbol,
                  symbol: network.currencySymbol,
                  decimals: 18,
                },
                rpcUrls: network.rpcUrls,
                blockExplorerUrls: network.blockExplorerUrls,
              },
            ],
          });
        } catch (addError: any) {
          throw this.parseError(addError);
        }
      } else {
        throw this.parseError(switchError);
      }
    }
  }

  /**
   * Converts raw MetaMask and RPC errors into clear, understandable messages.
   */
  public static parseError(error: any): Error {
    if (!error) return new Error("An unexpected error occurred.");

    const code = error.code;
    const message = error.message || "";

    if (code === 4001 || message.includes("User rejected") || message.includes("user rejected")) {
      return new Error("Request was rejected by user in MetaMask.");
    }

    if (code === -32002) {
      return new Error("A request is already pending in MetaMask. Please open MetaMask to approve or cancel it.");
    }

    if (code === -32602) {
      return new Error("Invalid parameters provided to the wallet provider.");
    }

    if (code === -32603) {
      if (message.includes("insufficient funds")) {
        return new Error("Insufficient ETH in wallet to cover amount and gas fees.");
      }
      return new Error("Internal JSON-RPC error. Please verify your network and gas settings.");
    }

    if (message.includes("insufficient funds")) {
      return new Error("Insufficient ETH balance to complete this transaction.");
    }

    if (message.includes("execution reverted")) {
      const match = message.match(/execution reverted:? ?(.*)?/);
      const reason = match && match[1] ? match[1].replace(/["']/g, "") : "Contract execution reverted";
      return new Error(`Contract rejected transaction: ${reason}`);
    }

    if (message.includes("network changed") || message.includes("underlying network changed")) {
      return new Error("Blockchain network changed during execution. Please retry.");
    }

    return new Error(message || "An unexpected blockchain error occurred.");
  }
}
