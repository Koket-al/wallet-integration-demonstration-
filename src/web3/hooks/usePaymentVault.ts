import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "./useWeb3";
import { ContractService } from "../services/contractService";
import { MockContractService } from "../services/mockContractService";
import { getContractAddressForChain } from "../config/contracts";
import {
  TransactionStatus,
  TransactionRecord,
} from "../types";
import { useAppDispatch } from "../../store/hooks";
import { showAlert } from "../../store/alert";

const TX_HISTORY_KEY = "web3_payment_vault_history";

export function usePaymentVault(initialMockMode: boolean = true) {
  const { account, chainId, status: walletStatus, refreshBalance: refreshWalletBalance } = useWeb3();
  const dispatch = useAppDispatch();

  // Mode: true for Demo Mock Vault, false for Live EVM On-Chain Contract
  const [isMockMode, setIsMockMode] = useState<boolean>(initialMockMode);

  // Contract address
  const [contractAddress, setContractAddress] = useState<string>(
    getContractAddressForChain(chainId)
  );

  // Vault state
  const [contractBalance, setContractBalance] = useState<string>("0.0000");
  const [userVaultBalance, setUserVaultBalance] = useState<string>("0.0000");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [activeTxHash, setActiveTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Transaction history
  const [history, setHistory] = useState<TransactionRecord[]>(() => {
    try {
      const stored = localStorage.getItem(TX_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveHistoryRecord = useCallback((record: TransactionRecord) => {
    setHistory((prev) => {
      const updated = [record, ...prev.filter((r) => r.id !== record.id)].slice(0, 20);
      try {
        localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Update contract address when chain changes
  useEffect(() => {
    setContractAddress(getContractAddressForChain(chainId));
  }, [chainId]);

  // Fetch balances (both contract and user's vault balance)
  const refreshBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isMockMode) {
        const cBal = await MockContractService.getBalance();
        setContractBalance(cBal);

        if (account) {
          const uBal = await MockContractService.getUserVaultBalance(account);
          setUserVaultBalance(uBal);
        } else {
          setUserVaultBalance("0.0000");
        }
      } else {
        if (!account || walletStatus !== "connected") {
          // In real mode without connected wallet, show zero or try read-only balance
          setContractBalance("0.0000");
          setUserVaultBalance("0.0000");
          setIsLoading(false);
          return;
        }

        const cBal = await ContractService.getBalance(contractAddress);
        setContractBalance(parseFloat(cBal).toFixed(4));

        const uBal = await ContractService.getUserVaultBalance(contractAddress, account);
        setUserVaultBalance(parseFloat(uBal).toFixed(4));
      }
    } catch (err: any) {
      console.warn("Failed to fetch vault balances:", err);
      // Don't show hard error for background balance fetch, just fallback
    } finally {
      setIsLoading(false);
    }
  }, [isMockMode, account, walletStatus, contractAddress]);

  // Load balances on mount or state change
  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  // Deposit interaction
  const deposit = useCallback(
    async (amountEth: string) => {
      const num = parseFloat(amountEth);
      if (isNaN(num) || num <= 0) {
        const msg = "Please enter a valid deposit amount greater than 0 ETH.";
        setError(msg);
        dispatch(showAlert({ message: msg, severity: "error" }));
        return;
      }

      setError(null);
      setSuccessMessage(null);
      setTxStatus("preparing");

      try {
        if (isMockMode) {
          setTxStatus("pending");
          const { txHash, record } = await MockContractService.deposit(
            account || "0xDemoUserAddress00000000000000000000000001",
            amountEth
          );
          setActiveTxHash(txHash);
          saveHistoryRecord(record);

          setTxStatus("confirmed");
          const successMsg = `Successfully deposited ${amountEth} ETH into the vault (Demo Mode).`;
          setSuccessMessage(successMsg);
          dispatch(showAlert({ message: successMsg, severity: "success" }));

          await refreshBalances();
          await refreshWalletBalance();
        } else {
          if (!account || walletStatus !== "connected") {
            throw new Error("Wallet is not connected. Please connect MetaMask to deposit.");
          }

          setTxStatus("pending");
          const tx = await ContractService.deposit(contractAddress, amountEth);
          setActiveTxHash(tx.hash);

          // Add pending record
          const pendingRecord: TransactionRecord = {
            id: tx.hash,
            hash: tx.hash,
            type: "deposit",
            amount: parseFloat(amountEth).toFixed(4),
            timestamp: Date.now(),
            status: "pending",
            isMock: false,
          };
          saveHistoryRecord(pendingRecord);

          // Wait for on-chain confirmation (1 block)
          const receipt = await tx.wait(1);

          // Update record to confirmed
          const confirmedRecord: TransactionRecord = {
            ...pendingRecord,
            status: "confirmed",
            blockNumber: receipt.blockNumber,
          };
          saveHistoryRecord(confirmedRecord);

          setTxStatus("confirmed");
          const successMsg = `Successfully deposited ${amountEth} ETH to contract on-chain! Tx: ${tx.hash.substring(
            0,
            10
          )}...`;
          setSuccessMessage(successMsg);
          dispatch(showAlert({ message: successMsg, severity: "success" }));

          await refreshBalances();
          await refreshWalletBalance();
        }
      } catch (err: any) {
        console.error("Deposit interaction error:", err);
        const errMsg = err.message || "Deposit transaction failed.";
        setError(errMsg);
        setTxStatus("failed");
        dispatch(showAlert({ message: errMsg, severity: "error" }));
      }
    },
    [
      isMockMode,
      account,
      walletStatus,
      contractAddress,
      saveHistoryRecord,
      refreshBalances,
      refreshWalletBalance,
      dispatch,
    ]
  );

  // Withdraw interaction
  const withdraw = useCallback(
    async (amountEth: string) => {
      const num = parseFloat(amountEth);
      if (isNaN(num) || num <= 0) {
        const msg = "Please enter a valid withdrawal amount greater than 0 ETH.";
        setError(msg);
        dispatch(showAlert({ message: msg, severity: "error" }));
        return;
      }

      const available = parseFloat(userVaultBalance);
      if (num > available) {
        const msg = `Withdrawal amount (${num} ETH) exceeds your deposited vault balance (${available} ETH).`;
        setError(msg);
        dispatch(showAlert({ message: msg, severity: "error" }));
        return;
      }

      setError(null);
      setSuccessMessage(null);
      setTxStatus("preparing");

      try {
        if (isMockMode) {
          setTxStatus("pending");
          const { txHash, record } = await MockContractService.withdraw(
            account || "0xDemoUserAddress00000000000000000000000001",
            amountEth
          );
          setActiveTxHash(txHash);
          saveHistoryRecord(record);

          setTxStatus("confirmed");
          const successMsg = `Successfully withdrew ${amountEth} ETH from vault (Demo Mode).`;
          setSuccessMessage(successMsg);
          dispatch(showAlert({ message: successMsg, severity: "success" }));

          await refreshBalances();
          await refreshWalletBalance();
        } else {
          if (!account || walletStatus !== "connected") {
            throw new Error("Wallet is not connected. Please connect MetaMask to withdraw.");
          }

          setTxStatus("pending");
          const tx = await ContractService.withdraw(contractAddress, amountEth);
          setActiveTxHash(tx.hash);

          // Add pending record
          const pendingRecord: TransactionRecord = {
            id: tx.hash,
            hash: tx.hash,
            type: "withdraw",
            amount: parseFloat(amountEth).toFixed(4),
            timestamp: Date.now(),
            status: "pending",
            isMock: false,
          };
          saveHistoryRecord(pendingRecord);

          // Wait for on-chain confirmation (1 block)
          const receipt = await tx.wait(1);

          // Update record to confirmed
          const confirmedRecord: TransactionRecord = {
            ...pendingRecord,
            status: "confirmed",
            blockNumber: receipt.blockNumber,
          };
          saveHistoryRecord(confirmedRecord);

          setTxStatus("confirmed");
          const successMsg = `Successfully withdrew ${amountEth} ETH on-chain! Tx: ${tx.hash.substring(
            0,
            10
          )}...`;
          setSuccessMessage(successMsg);
          dispatch(showAlert({ message: successMsg, severity: "success" }));

          await refreshBalances();
          await refreshWalletBalance();
        }
      } catch (err: any) {
        console.error("Withdrawal interaction error:", err);
        const errMsg = err.message || "Withdrawal transaction failed.";
        setError(errMsg);
        setTxStatus("failed");
        dispatch(showAlert({ message: errMsg, severity: "error" }));
      }
    },
    [
      userVaultBalance,
      isMockMode,
      account,
      walletStatus,
      contractAddress,
      saveHistoryRecord,
      refreshBalances,
      refreshWalletBalance,
      dispatch,
    ]
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setTxStatus("idle");
    setActiveTxHash(null);
  }, []);

  const toggleMockMode = useCallback((val?: boolean) => {
    setIsMockMode((prev) => (typeof val === "boolean" ? val : !prev));
    clearMessages();
  }, [clearMessages]);

  return {
    contractBalance,
    userVaultBalance,
    isLoading,
    txStatus,
    activeTxHash,
    error,
    successMessage,
    isMockMode,
    contractAddress,
    history,
    deposit,
    withdraw,
    refreshBalances,
    toggleMockMode,
    setContractAddress,
    clearMessages,
  };
}
