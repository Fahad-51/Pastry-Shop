import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // <-- This is required
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppContextProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppContextProvider>
      <CartProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CartProvider>
    </AppContextProvider>
  </React.StrictMode>
);
