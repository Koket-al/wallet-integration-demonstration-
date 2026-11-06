import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BoltIcon from "@mui/icons-material/Bolt";

import { useWeb3 } from "../hooks/useWeb3";
import { usePaymentVault } from "../hooks/usePaymentVault";
import { formatAddress, getExplorerTxUrl } from "../config/networks";

interface PaymentVaultCardProps {
  sellerAddress?: string;
  onTxSuccess?: (txHash: string) => void;
}

export const PaymentVaultCard: React.FC<PaymentVaultCardProps> = ({
  sellerAddress,
  onTxSuccess,
}) => {
  const {
    account,
    chainId,
    networkInfo,
    balance: walletBalance,
    status: walletStatus,
    connectWallet,
  } = useWeb3();

  const {
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
    clearMessages,
  } = usePaymentVault(true); // Default to interactive demo vault for safe evaluation

  // Local form inputs
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const isConnected = walletStatus === "connected" && Boolean(account);
  const isTransacting = txStatus === "preparing" || txStatus === "pending";

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    await deposit(depositAmount);
    setDepositAmount("");
    if (onTxSuccess && activeTxHash) {
      onTxSuccess(activeTxHash);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    await withdraw(withdrawAmount);
    setWithdrawAmount("");
    if (onTxSuccess && activeTxHash) {
      onTxSuccess(activeTxHash);
    }
  };

  const setDepositPreset = (val: string) => {
    setDepositAmount(val);
  };

  const setWithdrawPercentage = (pct: number) => {
    const available = parseFloat(userVaultBalance);
    if (available > 0) {
      const calc = ((available * pct) / 100).toFixed(4);
      setWithdrawAmount(calc);
    }
  };

  return (
    <Card
      elevation={4}
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#173039",
        color: "#ffffff",
        border: "2px solid #00dbe3",
        boxShadow: "0 8px 32px rgba(0, 219, 227, 0.15)",
        mt: 4,
        mb: 4,
      }}
    >
      {/* Top Banner & Header */}
      <Box
        sx={{
          backgroundColor: "#112228",
          px: { xs: 2.5, md: 4 },
          py: 2.5,
          borderBottom: "1px solid rgba(0, 219, 227, 0.25)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "8px",
              backgroundColor: "rgba(0, 219, 227, 0.15)",
              border: "1px solid #00dbe3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockOutlinedIcon sx={{ color: "#00dbe3", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                fontSize: { xs: "20px", md: "24px" },
              }}
            >
              Web3 Smart Contract Vault
            </Typography>
            <Typography variant="body2" sx={{ color: "#8ab4c1" }}>
              EVM Payment Escrow • Direct Ethereum Contract Interaction
            </Typography>
          </Box>
        </Box>

        {/* Mode Switch: Demo Sandbox vs Live EVM Contract */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            px: 2,
            py: 0.8,
            borderRadius: "30px",
            border: "1px solid rgba(0, 219, 227, 0.2)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: isMockMode ? "#ffaf35" : "#00dbe3",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <BoltIcon fontSize="small" />
            {isMockMode ? "Demo Sandbox Vault" : "Live EVM Contract"}
          </Typography>
          <Tooltip
            title="Toggle between Demo Sandbox (safe local test simulation) and Live EVM On-Chain Contract via MetaMask."
            arrow
          >
            <FormControlLabel
              control={
                <Switch
                  checked={!isMockMode}
                  onChange={(e) => toggleMockMode(!e.target.checked)}
                  color="primary"
                  size="small"
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#00dbe3",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#00dbe3",
                    },
                  }}
                />
              }
              label={
                <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 600 }}>
                  Live Mode
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Tooltip>
        </Box>
      </Box>

      {/* Mode Advisory Alert */}
      <Box sx={{ px: { xs: 2.5, md: 4 }, pt: 2.5 }}>
        {isMockMode ? (
          <Alert
            severity="warning"
            icon={<InfoOutlinedIcon />}
            sx={{
              backgroundColor: "rgba(255, 175, 53, 0.12)",
              color: "#ffaf35",
              border: "1px solid rgba(255, 175, 53, 0.3)",
              borderRadius: "8px",
              "& .MuiAlert-icon": { color: "#ffaf35" },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              <strong>Demo Sandbox Mode Active:</strong> Transactions are simulated locally with
              instant block confirmation. Switch toggle above to "Live Mode" for real MetaMask
              on-chain transactions.
            </Typography>
          </Alert>
        ) : (
          <Alert
            severity="info"
            icon={<BoltIcon />}
            sx={{
              backgroundColor: "rgba(0, 219, 227, 0.1)",
              color: "#00dbe3",
              border: "1px solid rgba(0, 219, 227, 0.3)",
              borderRadius: "8px",
              "& .MuiAlert-icon": { color: "#00dbe3" },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              <strong>Live EVM Contract Mode Active:</strong> Interacting with on-chain PaymentVault
              contract at <code>{contractAddress}</code> on {networkInfo.name}. Transactions require
              MetaMask signature and gas.
            </Typography>
          </Alert>
        )}
      </Box>

      <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
        {/* Balances & Stats Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 2.5,
            mb: 4,
          }}
        >
          {/* Card 1: Contract Total Balance (getBalance) */}
          <Box
            sx={{
              backgroundColor: "rgba(0, 219, 227, 0.08)",
              border: "1px solid rgba(0, 219, 227, 0.35)",
              borderRadius: "10px",
              p: 2.5,
              position: "relative",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "#00dbe3", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
                Contract Vault Balance
              </Typography>
              <Tooltip title="Refresh balance from contract (calls getBalance())" arrow>
                <IconButton
                  size="small"
                  onClick={refreshBalances}
                  disabled={isLoading}
                  sx={{ color: "#00dbe3", p: 0.5 }}
                >
                  <RefreshIcon
                    fontSize="small"
                    sx={{
                      animation: isLoading ? "spin 1s linear infinite" : "none",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                mt: 1,
                fontSize: { xs: "28px", md: "32px" },
              }}
            >
              {contractBalance} <span style={{ fontSize: "18px", color: "#00dbe3" }}>ETH</span>
            </Typography>
            <Typography variant="caption" sx={{ color: "#8ab4c1" }}>
              Interface: <code>getBalance()</code>
            </Typography>
          </Box>

          {/* Card 2: User's Deposited Vault Balance (balanceOf) */}
          <Box
            sx={{
              backgroundColor: "rgba(35, 162, 187, 0.12)",
              border: "1px solid rgba(35, 162, 187, 0.4)",
              borderRadius: "10px",
              p: 2.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "#23a2bb", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              Your Deposited Balance
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                mt: 1,
                fontSize: { xs: "28px", md: "32px" },
              }}
            >
              {userVaultBalance} <span style={{ fontSize: "18px", color: "#23a2bb" }}>ETH</span>
            </Typography>
            <Typography variant="caption" sx={{ color: "#8ab4c1" }}>
              Available to withdraw • <code>balanceOf(user)</code>
            </Typography>
          </Box>

          {/* Card 3: User Wallet Balance */}
          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              p: 2.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "#8ab4c1", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              Your Wallet Balance
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                mt: 1,
                fontSize: { xs: "28px", md: "32px" },
              }}
            >
              {isConnected ? walletBalance : "—"}{" "}
              <span style={{ fontSize: "18px", color: "#8ab4c1" }}>ETH</span>
            </Typography>
            <Typography variant="caption" sx={{ color: "#8ab4c1" }}>
              {isConnected ? `Account: ${formatAddress(account, 4)}` : "Wallet disconnected"}
            </Typography>
          </Box>
        </Box>

        {/* Wallet Connection Required Banner if Disconnected */}
        {!isConnected && (
          <Box
            sx={{
              backgroundColor: "rgba(0, 219, 227, 0.06)",
              border: "2px dashed #00dbe3",
              borderRadius: "12px",
              p: 4,
              textAlign: "center",
              mb: 4,
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 48, color: "#00dbe3", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff", mb: 1 }}>
              Connect Wallet to Interact With Smart Contract
            </Typography>
            <Typography variant="body2" sx={{ color: "#8ab4c1", maxWidth: "520px", mx: "auto", mb: 2.5 }}>
              Connect your MetaMask wallet to deposit ETH, withdraw your deposited funds, and
              execute payments directly through the decentralized vault.
            </Typography>
            <Button
              variant="contained"
              onClick={connectWallet}
              startIcon={<AccountBalanceWalletIcon />}
              sx={{
                backgroundColor: "#00dbe3",
                color: "#173039",
                fontWeight: 700,
                fontSize: "16px",
                px: 4,
                py: 1.2,
                borderRadius: "6px",
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#2dd8c8" },
              }}
            >
              Connect MetaMask
            </Button>
          </Box>
        )}

        {/* Transaction Lifecycle Status Stepper / Banner */}
        {isTransacting && (
          <Alert
            severity="info"
            icon={<CircularProgress size={20} sx={{ color: "#00dbe3" }} />}
            sx={{
              backgroundColor: "rgba(0, 219, 227, 0.15)",
              color: "#00dbe3",
              border: "1px solid #00dbe3",
              borderRadius: "8px",
              mb: 3,
            }}
          >
            <AlertTitle sx={{ fontWeight: 700, color: "#ffffff" }}>
              {txStatus === "preparing" ? "Preparing Transaction..." : "Transaction in Progress (Mining)..."}
            </AlertTitle>
            <Typography variant="body2" sx={{ color: "#ffffff" }}>
              {txStatus === "preparing"
                ? "Awaiting your signature in MetaMask..."
                : "Transaction submitted to the blockchain! Waiting for block confirmation..."}
            </Typography>
            {activeTxHash && (
              <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#00dbe3" }}>
                  Tx: {formatAddress(activeTxHash, 8)}
                </Typography>
                <IconButton size="small" onClick={() => handleCopyHash(activeTxHash)} sx={{ color: "#00dbe3", p: 0 }}>
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Box>
            )}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            onClose={clearMessages}
            sx={{
              backgroundColor: "rgba(255, 124, 76, 0.15)",
              color: "#ff7c4c",
              border: "1px solid #ff7c4c",
              borderRadius: "8px",
              mb: 3,
            }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>Transaction Failed</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert
            severity="success"
            onClose={clearMessages}
            sx={{
              backgroundColor: "rgba(41, 201, 143, 0.15)",
              color: "#29c98f",
              border: "1px solid #29c98f",
              borderRadius: "8px",
              mb: 3,
            }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>Transaction Confirmed</AlertTitle>
            {successMessage}
            {activeTxHash && (
              <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#ffffff" }}>
                  Hash: {formatAddress(activeTxHash, 8)}
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleCopyHash(activeTxHash)}
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  sx={{ color: "#29c98f", fontSize: "11px", textTransform: "none", p: 0 }}
                >
                  {copiedHash === activeTxHash ? "Copied" : "Copy"}
                </Button>
                {getExplorerTxUrl(chainId, activeTxHash) && (
                  <Button
                    size="small"
                    component="a"
                    href={getExplorerTxUrl(chainId, activeTxHash) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{ color: "#29c98f", fontSize: "11px", textTransform: "none", p: 0 }}
                  >
                    View on Explorer
                  </Button>
                )}
              </Box>
            )}
          </Alert>
        )}

        {/* Interaction Forms: Deposit & Withdraw */}
        <Box sx={{ borderBottom: "1px solid rgba(0, 219, 227, 0.2)", mb: 3 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={() => setActiveTab("deposit")}
              startIcon={<ArrowUpwardIcon />}
              sx={{
                fontWeight: 700,
                fontSize: "16px",
                textTransform: "uppercase",
                px: 3,
                py: 1,
                borderBottom: activeTab === "deposit" ? "3px solid #00dbe3" : "3px solid transparent",
                borderRadius: "0px",
                color: activeTab === "deposit" ? "#00dbe3" : "#8ab4c1",
                "&:hover": { color: "#ffffff", backgroundColor: "transparent" },
              }}
            >
              Deposit ETH (deposit)
            </Button>
            <Button
              onClick={() => setActiveTab("withdraw")}
              startIcon={<ArrowDownwardIcon />}
              sx={{
                fontWeight: 700,
                fontSize: "16px",
                textTransform: "uppercase",
                px: 3,
                py: 1,
                borderBottom: activeTab === "withdraw" ? "3px solid #00dbe3" : "3px solid transparent",
                borderRadius: "0px",
                color: activeTab === "withdraw" ? "#00dbe3" : "#8ab4c1",
                "&:hover": { color: "#ffffff", backgroundColor: "transparent" },
              }}
            >
              Withdraw ETH (withdraw)
            </Button>
          </Box>
        </Box>

        {/* Tab 1: Deposit Form */}
        {activeTab === "deposit" && (
          <Box component="form" onSubmit={handleDepositSubmit} sx={{ maxWidth: "600px" }}>
            <Typography variant="body2" sx={{ color: "#8ab4c1", mb: 2 }}>
              Deposit ETH to the smart contract vault via payable function <code>deposit()</code>.
              Your deposited balance will be credited and can be withdrawn at any time.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Deposit Amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.05"
                disabled={!isConnected || isTransacting}
                inputProps={{ min: "0.0001", step: "0.001" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ color: "#00dbe3", fontWeight: 700 }}>ETH</Typography>
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 219, 227, 0.4)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00dbe3",
                    },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#8ab4c1", "&.Mui-focused": { color: "#00dbe3" } },
                }}
              />
            </Box>

            {/* Quick Presets */}
            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
              {["0.01", "0.05", "0.1", "0.5"].map((preset) => (
                <Button
                  key={preset}
                  size="small"
                  variant="outlined"
                  disabled={!isConnected || isTransacting}
                  onClick={() => setDepositPreset(preset)}
                  sx={{
                    color: "#00dbe3",
                    borderColor: "rgba(0, 219, 227, 0.4)",
                    fontSize: "12px",
                    textTransform: "none",
                    borderRadius: "6px",
                    "&:hover": { borderColor: "#00dbe3", backgroundColor: "rgba(0,219,227,0.1)" },
                  }}
                >
                  +{preset} ETH
                </Button>
              ))}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                !isConnected ||
                isTransacting ||
                !depositAmount ||
                parseFloat(depositAmount) <= 0
              }
              startIcon={
                isTransacting ? (
                  <CircularProgress size={18} sx={{ color: "#173039" }} />
                ) : (
                  <ArrowUpwardIcon />
                )
              }
              sx={{
                backgroundColor: "#00dbe3",
                color: "#173039",
                fontWeight: 700,
                fontSize: "18px",
                height: "54px",
                borderRadius: "6px",
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#2dd8c8" },
                "&.Mui-disabled": {
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  color: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              {isTransacting ? "Processing Deposit..." : "Submit Deposit"}
            </Button>
          </Box>
        )}

        {/* Tab 2: Withdraw Form */}
        {activeTab === "withdraw" && (
          <Box component="form" onSubmit={handleWithdrawSubmit} sx={{ maxWidth: "600px" }}>
            <Typography variant="body2" sx={{ color: "#8ab4c1", mb: 2 }}>
              Withdraw your deposited ETH from the vault via function <code>withdraw(uint256 amount)</code>.
              Amount cannot exceed your deposited balance of {userVaultBalance} ETH.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Withdrawal Amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.05"
                disabled={!isConnected || isTransacting}
                inputProps={{
                  min: "0.0001",
                  max: userVaultBalance,
                  step: "0.001",
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ color: "#23a2bb", fontWeight: 700 }}>ETH</Typography>
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(35, 162, 187, 0.4)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#23a2bb",
                    },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#8ab4c1", "&.Mui-focused": { color: "#23a2bb" } },
                }}
              />
            </Box>

            {/* Quick Percentage Presets */}
            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
              {[25, 50, 75, 100].map((pct) => (
                <Button
                  key={pct}
                  size="small"
                  variant="outlined"
                  disabled={!isConnected || isTransacting || parseFloat(userVaultBalance) <= 0}
                  onClick={() => setWithdrawPercentage(pct)}
                  sx={{
                    color: "#23a2bb",
                    borderColor: "rgba(35, 162, 187, 0.4)",
                    fontSize: "12px",
                    textTransform: "none",
                    borderRadius: "6px",
                    "&:hover": { borderColor: "#23a2bb", backgroundColor: "rgba(35,162,187,0.1)" },
                  }}
                >
                  {pct === 100 ? "Max (100%)" : `${pct}%`}
                </Button>
              ))}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                !isConnected ||
                isTransacting ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                parseFloat(withdrawAmount) > parseFloat(userVaultBalance)
              }
              startIcon={
                isTransacting ? (
                  <CircularProgress size={18} sx={{ color: "#ffffff" }} />
                ) : (
                  <ArrowDownwardIcon />
                )
              }
              sx={{
                backgroundColor: "#23a2bb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "18px",
                height: "54px",
                borderRadius: "6px",
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#1c8499" },
                "&.Mui-disabled": {
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  color: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              {isTransacting ? "Processing Withdrawal..." : "Submit Withdrawal"}
            </Button>
          </Box>
        )}

        {/* Transaction History Section */}
        {history.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Divider sx={{ borderColor: "rgba(0, 219, 227, 0.2)", mb: 3 }} />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
                Recent Smart Contract Activity
              </Typography>
              <Typography variant="caption" sx={{ color: "#8ab4c1" }}>
                Showing last {history.length} transactions
              </Typography>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 500 }}>
                <TableHead sx={{ backgroundColor: "rgba(0, 219, 227, 0.08)" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#00dbe3", fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ color: "#00dbe3", fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ color: "#00dbe3", fontWeight: 700 }}>Tx Hash</TableCell>
                    <TableCell sx={{ color: "#00dbe3", fontWeight: 700 }}>Time</TableCell>
                    <TableCell sx={{ color: "#00dbe3", fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((tx) => (
                    <TableRow
                      key={tx.id}
                      hover
                      sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.03)" } }}
                    >
                      <TableCell sx={{ color: "#ffffff", fontWeight: 600, textTransform: "uppercase" }}>
                        {tx.type === "deposit" ? (
                          <Chip
                            label="Deposit"
                            size="small"
                            sx={{ backgroundColor: "rgba(41, 201, 143, 0.2)", color: "#29c98f", fontWeight: 700 }}
                          />
                        ) : (
                          <Chip
                            label="Withdraw"
                            size="small"
                            sx={{ backgroundColor: "rgba(255, 175, 53, 0.2)", color: "#ffaf35", fontWeight: 700 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: "#ffffff", fontWeight: 700 }}>
                        {tx.amount} ETH
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", color: "#8ab4c1" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          {formatAddress(tx.hash, 6)}
                          <IconButton size="small" onClick={() => handleCopyHash(tx.hash)} sx={{ color: "#8ab4c1", p: 0.2 }}>
                            <ContentCopyIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "#8ab4c1", fontSize: "12px" }}>
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.isMock ? "Simulated" : "Confirmed"}
                          size="small"
                          sx={{
                            backgroundColor: tx.isMock ? "rgba(255,255,255,0.1)" : "rgba(41, 201, 143, 0.2)",
                            color: tx.isMock ? "#cccccc" : "#29c98f",
                            fontSize: "11px",
                            height: "20px",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
