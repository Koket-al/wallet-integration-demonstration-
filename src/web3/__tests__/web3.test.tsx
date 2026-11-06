import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "../../store/store";
import { Web3Provider, useWeb3 } from "../context/Web3Context";
import { WalletConnectButton } from "../components/WalletConnectButton";
import { PaymentVaultCard } from "../components/PaymentVaultCard";
import { MockContractService } from "../services/mockContractService";
import { EthereumService } from "../services/ethereumService";
import { formatAddress, getNetworkInfo } from "../config/networks";

// Helper wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter>
      <Web3Provider>{children}</Web3Provider>
    </BrowserRouter>
  </Provider>
);

describe("Web3 Integration Test Suite", () => {
  const originalEthereum = window.ethereum;

  beforeEach(() => {
    localStorage.clear();
    MockContractService.resetVault();
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.ethereum = originalEthereum;
  });

  // Scenario 1: Application loads without a connected wallet
  test("1. Application loads in disconnected state without errors", () => {
    delete (window as any).ethereum;

    render(
      <TestWrapper>
        <WalletConnectButton />
        <PaymentVaultCard />
      </TestWrapper>
    );

    const connectButtons = screen.getAllByText(/Connect Wallet/i);
    expect(connectButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Connect Wallet to Interact With Smart Contract/i)).toBeInTheDocument();
  });

  // Scenario 2: User connects MetaMask successfully
  test("2. User connects MetaMask successfully and address is displayed", async () => {
    const mockAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const mockAccountsChangedCallbacks: ((accounts: string[]) => void)[] = [];

    window.ethereum = {
      isMetaMask: true,
      request: jest.fn().mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_accounts") {
          return Promise.resolve([]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve("0xaa36a7"); // Sepolia 11155111
        }
        return Promise.resolve(null);
      }),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === "accountsChanged") mockAccountsChangedCallbacks.push(cb);
      }),
      removeListener: jest.fn(),
    } as any;

    render(
      <TestWrapper>
        <WalletConnectButton />
      </TestWrapper>
    );

    const button = screen.getByText(/Connect Wallet/i);
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText(/0x7099...79C8/i)).toBeInTheDocument();
      expect(screen.getByText(/Sepolia/i)).toBeInTheDocument();
    });
  });

  // Scenario 3: User rejects connection
  test("3. Handles user rejecting connection gracefully", async () => {
    window.ethereum = {
      isMetaMask: true,
      request: jest.fn().mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          const err: any = new Error("User rejected the request.");
          err.code = 4001;
          return Promise.reject(err);
        }
        if (method === "eth_accounts") return Promise.resolve([]);
        if (method === "eth_chainId") return Promise.resolve("0xaa36a7");
        return Promise.resolve(null);
      }),
      on: jest.fn(),
      removeListener: jest.fn(),
    } as any;

    render(
      <TestWrapper>
        <WalletConnectButton />
      </TestWrapper>
    );

    const button = screen.getByText(/Connect Wallet/i);
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText(/Retry Connect/i)).toBeInTheDocument();
    });
  });

  // Scenario 4: Wallet address formatting helper works correctly
  test("4. Formats address with truncation correctly", () => {
    const full = "0x71C8363820F80E6837130843A021021111664e8B";
    expect(formatAddress(full, 4)).toBe("0x71C8...4e8B");
    expect(formatAddress(full, 6)).toBe("0x71C836...664e8B");
    expect(formatAddress(null)).toBe("");
  });

  // Scenario 5: Network changes (chainChanged) update network information
  test("5. Network information updates correctly on chain change", () => {
    const mainnet = getNetworkInfo(1);
    expect(mainnet.name).toBe("Ethereum Mainnet");
    expect(mainnet.isTestnet).toBe(false);

    const sepolia = getNetworkInfo(11155111);
    expect(sepolia.name).toBe("Sepolia Testnet");
    expect(sepolia.isTestnet).toBe(true);

    const hardhat = getNetworkInfo(31337);
    expect(hardhat.shortName).toBe("Localhost 31337");
  });

  // Scenario 6: Contract balance can be read
  test("6. Contract balance can be read via getBalance()", async () => {
    const balance = await MockContractService.getBalance();
    expect(parseFloat(balance)).toBeGreaterThan(0);
    expect(typeof balance).toBe("string");
  });

  // Scenario 7: Deposit interaction works
  test("7. Deposit interaction updates vault total and user balance", async () => {
    const user = "0xTestUserAddress1234567890";
    const initialBal = await MockContractService.getBalance();

    const { txHash, record } = await MockContractService.deposit(user, "0.5");
    expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(record.status).toBe("confirmed");
    expect(record.amount).toBe("0.5000");

    const newBal = await MockContractService.getBalance();
    expect(parseFloat(newBal)).toBeCloseTo(parseFloat(initialBal) + 0.5, 3);

    const userDeposit = await MockContractService.getUserVaultBalance(user);
    expect(parseFloat(userDeposit)).toBeCloseTo(0.5, 3);
  });

  // Scenario 8: Withdrawal interaction works
  test("8. Withdrawal interaction reduces balance correctly", async () => {
    const user = "0xWithdrawTester";
    await MockContractService.deposit(user, "1.0");

    const { txHash, record } = await MockContractService.withdraw(user, "0.4");
    expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(record.type).toBe("withdraw");

    const remaining = await MockContractService.getUserVaultBalance(user);
    expect(parseFloat(remaining)).toBeCloseTo(0.6, 3);
  });

  // Scenario 9: Error handling prevents withdrawal exceeding balance
  test("9. Rejects withdrawal greater than user deposited balance", async () => {
    const user = "0xLowBalanceUser";
    await MockContractService.deposit(user, "0.1");

    await expect(MockContractService.withdraw(user, "0.5")).rejects.toThrow(
      /Insufficient deposited balance/i
    );
  });

  // Scenario 10: EthereumService converts error codes to user-friendly messages
  test("10. EthereumService transforms raw errors into user-friendly messages", () => {
    const rejectErr = { code: 4001, message: "User rejected request" };
    expect(EthereumService.parseError(rejectErr).message).toMatch(
      /rejected by user/i
    );

    const pendingErr = { code: -32002, message: "Request already pending" };
    expect(EthereumService.parseError(pendingErr).message).toMatch(
      /already pending/i
    );

    const fundErr = { message: "insufficient funds for gas * price + value" };
    expect(EthereumService.parseError(fundErr).message).toMatch(
      /Insufficient ETH/i
    );
  });
});
