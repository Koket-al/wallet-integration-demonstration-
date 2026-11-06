import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store/store';
import { Web3Provider } from './web3';
import { Header } from './components/header';

test('renders Header with Connect Wallet button', () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <Web3Provider>
          <Header />
        </Web3Provider>
      </BrowserRouter>
    </Provider>
  );

  const connectButton = screen.getByText(/Connect Wallet/i);
  expect(connectButton).toBeInTheDocument();
});
