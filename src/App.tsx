import React from "react";
import "./App.css";
import "./assets/css/globals.css";
// import "./assets/css/react-slick.css";
// import "slick-carousel/slick/slick.css";
import { ThemeProvider } from "@mui/material";
import { useRoutes } from "react-router-dom";
import Router from "./routes/Router";
import theme from "./theme";
import { Web3Provider } from "./web3";

function App() {
  const routing = useRoutes(Router);
  return (
    <ThemeProvider theme={theme}>
      <Web3Provider>
        <div className="App">{routing}</div>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
