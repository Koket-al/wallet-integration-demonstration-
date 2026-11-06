import React, { useState } from "react";
import { Box, CircularProgress, Typography, Tooltip } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useWeb3 } from "../hooks/useWeb3";
import { formatAddress } from "../config/networks";
import { WalletDetailsModal } from "./WalletDetailsModal";

export const WalletConnectButton: React.FC = () => {
  const { status, account, networkInfo, isMetaMaskInstalled, error, connectWallet } = useWeb3();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    if (status === "connected") {
      setModalOpen(true);
    } else {
      connectWallet();
    }
  };

  if (status === "connected" && account) {
    return (
      <>
        <Box
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="View connected wallet"
          sx={{
            position: "relative",
            color: "#173039",
            cursor: "pointer",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            mb: { xs: 2, lg: 0 },
            width: { xs: "100%", lg: "324px" },
            height: "45px",
            borderRadius: "6px",
            backgroundColor: "#00dbe3",
            transition: "all 0.2s ease-in-out",
            boxShadow: "0 4px 12px rgba(0, 219, 227, 0.35)",
            "&:hover": {
              backgroundColor: "#2dd8c8",
              transform: "translateY(-1px)",
            },
          }}
        >
          {/* Network indicator dot & name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                backgroundColor: networkInfo.isTestnet ? "#ffaf35" : "#29C98F",
                boxShadow: `0 0 6px ${networkInfo.isTestnet ? "#ffaf35" : "#29C98F"}`,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "0.5px",
                color: "#173039",
              }}
            >
              {networkInfo.shortName}
            </Typography>
          </Box>

          {/* Formatted address badge */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              backgroundColor: "rgba(23, 48, 57, 0.12)",
              borderRadius: "4px",
              px: 1,
              py: 0.3,
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 16, color: "#173039" }} />
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "13px",
                color: "#173039",
              }}
            >
              {formatAddress(account, 4)}
            </Typography>
          </Box>
        </Box>

        <WalletDetailsModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Connecting state
  if (status === "connecting") {
    return (
      <Box
        sx={{
          position: "relative",
          color: "white",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          px: { xs: 0, lg: 3 },
          mb: { xs: 3, lg: 0 },
          fontSize: "18px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1px",
          width: { xs: "100%", lg: "324px" },
          height: "45px",
          borderRadius: "6px",
          backgroundColor: "#173039",
          border: "2px solid #00dbe3",
        }}
      >
        <CircularProgress size={20} sx={{ color: "#00dbe3" }} />
        <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#00dbe3" }}>
          Connecting...
        </Typography>
      </Box>
    );
  }

  // Disconnected / Initial State
  return (
    <Tooltip
      title={
        !isMetaMaskInstalled
          ? "MetaMask not detected. Click to learn how to install."
          : error
          ? error
          : "Connect MetaMask wallet"
      }
      arrow
    >
      <Box
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Connect Wallet"
        sx={{
          position: "relative",
          color: "#ffffff",
          cursor: "pointer",
          textDecoration: "none",
          textTransform: "uppercase",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.2,
          px: { xs: 0, lg: 3 },
          mb: { xs: 3, lg: 0 },
          fontSize: "20px",
          lineHeight: "6px",
          width: { xs: "100%", lg: "324px" },
          height: "45px",
          borderRadius: "6px",
          backgroundColor: error ? "#e57373" : "#00dbe3",
          boxShadow: "0 4px 12px rgba(0, 219, 227, 0.3)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: error ? "#f44336" : "#2dd8c8",
            transform: "translateY(-1px)",
            color: "#173039",
          },
        }}
      >
        {error ? (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 22 }} />
            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
              Retry Connect
            </Typography>
          </>
        ) : (
          <>
            <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />
            <span>Connect Wallet</span>
          </>
        )}
      </Box>
    </Tooltip>
  );
};
