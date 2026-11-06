import { ethers } from "ethers";
import { PAYMENT_VAULT_ABI } from "../config/contracts";
import { EthereumService } from "./ethereumService";

export class ContractService {
  /**
   * Get an instance of the PaymentVault contract with read-only provider or read-write signer.
   */
  public static async getContract(
    contractAddress: string,
    withSigner: boolean = false
  ): Promise<ethers.Contract> {
    const provider = EthereumService.getProvider();
    if (!provider) {
      throw new Error("No Web3 provider available. Please connect MetaMask.");
    }

    if (!ethers.utils.isAddress(contractAddress)) {
      throw new Error(`Invalid contract address: ${contractAddress}`);
    }

    if (withSigner) {
      const signer = await EthereumService.getSigner();
      if (!signer) {
        throw new Error("Signer not available. Please connect your wallet.");
      }
      return new ethers.Contract(contractAddress, PAYMENT_VAULT_ABI, signer);
    }

    return new ethers.Contract(contractAddress, PAYMENT_VAULT_ABI, provider);
  }

  /**
   * Read the contract total balance via getBalance()
   */
  public static async getBalance(contractAddress: string): Promise<string> {
    try {
      const contract = await this.getContract(contractAddress, false);
      const balanceWei = await contract.getBalance();
      return ethers.utils.formatEther(balanceWei);
    } catch (error: any) {
      // Fallback: If getBalance() fails on an unverified address or standard contract, check address balance
      try {
        const provider = EthereumService.getProvider();
        if (provider) {
          const raw = await provider.getBalance(contractAddress);
          return ethers.utils.formatEther(raw);
        }
      } catch {
        // ignore
      }
      throw EthereumService.parseError(error);
    }
  }

  /**
   * Read a user's deposited balance via balanceOf(user)
   */
  public static async getUserVaultBalance(
    contractAddress: string,
    userAddress: string
  ): Promise<string> {
    try {
      const contract = await this.getContract(contractAddress, false);
      if (typeof contract.balanceOf === "function") {
        const balanceWei = await contract.balanceOf(userAddress);
        return ethers.utils.formatEther(balanceWei);
      }
      return "0.0";
    } catch (error: any) {
      // If balanceOf is not supported, return 0.0 safely
      return "0.0";
    }
  }

  /**
   * Execute deposit() with payable ETH value
   */
  public static async deposit(
    contractAddress: string,
    amountEth: string
  ): Promise<ethers.ContractTransaction> {
    const numAmount = parseFloat(amountEth);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Deposit amount must be a positive number greater than 0.");
    }

    try {
      const contract = await this.getContract(contractAddress, true);
      const value = ethers.utils.parseEther(amountEth);

      // Estimate gas or pass overrides
      const tx = await contract.deposit({ value });
      return tx;
    } catch (error: any) {
      throw EthereumService.parseError(error);
    }
  }

  /**
   * Execute withdraw(amount) to withdraw ETH
   */
  public static async withdraw(
    contractAddress: string,
    amountEth: string
  ): Promise<ethers.ContractTransaction> {
    const numAmount = parseFloat(amountEth);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Withdrawal amount must be a positive number greater than 0.");
    }

    try {
      const contract = await this.getContract(contractAddress, true);
      const amountWei = ethers.utils.parseEther(amountEth);

      const tx = await contract.withdraw(amountWei);
      return tx;
    } catch (error: any) {
      throw EthereumService.parseError(error);
    }
  }
}
