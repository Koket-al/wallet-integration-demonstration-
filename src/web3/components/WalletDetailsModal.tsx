import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LogoutIcon from "@mui/icons-material/Logout";
import { useWeb3 } from "../hooks/useWeb3";
import { getExplorerAddressUrl, SUPPORTED_NETWORKS } from "../config/networks";

interface WalletDetailsModalProps {
  open: boolean;
  onClose: () => void;
}

export const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({ open, onClose }) => {
  const { account, chainId, networkInfo, balance, disconnectWallet, switchNetwork } = useWeb3();
  const [copied, setCopied] = useState(false);
  const [switchingChainId, setSwitchingChainId] = useState<number | null>(null);

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  const handleSwitchNetwork = async (targetId: number) => {
    setSwitchingChainId(targetId);
    try {
      await switchNetwork(targetId);
    } catch {
      // handled in context
    } finally {
      setSwitchingChainId(null);
    }
  };

  const explorerUrl = getExplorerAddressUrl(chainId, account || "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#173039",
          color: "#ffffff",
          borderRadius: "12px",
          border: "2px solid #00dbe3",
          boxShadow: "0 12px 36px rgba(0, 219, 227, 0.25)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          borderBottom: "1px solid rgba(0, 219, 227, 0.2)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceWalletIcon sx={{ color: "#00dbe3" }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
            Connected Wallet
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#ffffff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        {/* Account Address Box */}
        <Box
          sx={{
            backgroundColor: "rgba(0, 219, 227, 0.08)",
            border: "1px solid rgba(0, 219, 227, 0.3)",
            borderRadius: "8px",
            p: 2,
            mb: 2.5,
          }}
        >
          <Typography variant="caption" sx={{ color: "#8ab4c1", textTransform: "uppercase" }}>
            Account Address
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontFamily: "monospace",
                color: "#00dbe3",
                wordBreak: "break-all",
                fontSize: "14px",
              }}
            >
              {account}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCopy}
              startIcon={copied ? <CheckIcon sx={{ color: "#29C98F" }} /> : <ContentCopyIcon />}
              sx={{
                color: "#ffffff",
                borderColor: "rgba(255,255,255,0.3)",
                fontSize: "12px",
                textTransform: "none",
                "&:hover": { borderColor: "#00dbe3", backgroundColor: "rgba(0,219,227,0.1)" },
              }}
            >
              {copied ? "Copied!" : "Copy Address"}
            </Button>
            {explorerUrl && (
              <Button
                size="small"
                variant="outlined"
                component="a"
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                startIcon={<OpenInNewIcon />}
                sx={{
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                  fontSize: "12px",
                  textTransform: "none",
                  "&:hover": { borderColor: "#00dbe3", backgroundColor: "rgba(0,219,227,0.1)" },
                }}
              >
                Explorer
              </Button>
            )}
          </Box>
        </Box>

        {/* Balance & Network stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: "8px",
              p: 1.5,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography variant="caption" sx={{ color: "#8ab4c1" }}>
              Wallet Balance
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff", mt: 0.5 }}>
              {balance} {networkInfo.currencySymbol}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: "8px",
              p: 1.5,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography variant="caption" sx={{ color: "#8ab4c1" }}>
              Active Network
            </Typography>
            <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
              <Chip
                label={networkInfo.shortName}
                size="small"
                sx={{
                  backgroundColor: networkInfo.isTestnet ? "#ffaf35" : "#29C98F",
                  color: "#173039",
                  fontWeight: 700,
                  fontSize: "11px",
                  height: "22px",
                }}
              />
              <Typography variant="caption" sx={{ color: "#8ab4c1" }}>
                ({chainId})
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />

        {/* Network Switch section */}
        <Typography variant="caption" sx={{ color: "#8ab4c1", textTransform: "uppercase", display: "block", mb: 1 }}>
          Switch Network
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {[11155111, 1, 31337].map((netId) => {
            const net = SUPPORTED_NETWORKS[netId];
            if (!net) return null;
            const isCurrent = chainId === netId;
            return (
              <Button
                key={netId}
                size="small"
                variant={isCurrent ? "contained" : "outlined"}
                disabled={isCurrent || switchingChainId === netId}
                onClick={() => handleSwitchNetwork(netId)}
                startIcon={isCurrent ? <CheckIcon /> : <SwapHorizIcon />}
                sx={{
                  fontSize: "12px",
                  textTransform: "none",
                  backgroundColor: isCurrent ? "#00dbe3" : "transparent",
                  color: isCurrent ? "#173039" : "#ffffff",
                  borderColor: isCurrent ? "#00dbe3" : "rgba(255,255,255,0.2)",
                  fontWeight: isCurrent ? 700 : 500,
                  "&:hover": {
                    backgroundColor: isCurrent ? "#00b4c9" : "rgba(0,219,227,0.15)",
                    borderColor: "#00dbe3",
                  },
                }}
              >
                {net.shortName}
              </Button>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, borderTop: "1px solid rgba(0, 219, 227, 0.2)" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleDisconnect}
          startIcon={<LogoutIcon />}
          sx={{
            backgroundColor: "rgba(255, 76, 76, 0.15)",
            color: "#ff7c4c",
            border: "1px solid #ff7c4c",
            fontWeight: 700,
            textTransform: "uppercase",
            borderRadius: "6px",
            "&:hover": {
              backgroundColor: "rgba(255, 76, 76, 0.25)",
              borderColor: "#ff5252",
            },
          }}
        >
          Disconnect Wallet
        </Button>
      </DialogActions>
    </Dialog>
  );
};
