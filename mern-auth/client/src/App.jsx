import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import EmailVerify from './pages/EmailVerify';
import ProductDetails from './pages/viewDetails';
import CartPage from './pages/CartPage'; 
import Checkout from './pages/Checkout'; 
import Inbox from './pages/Inbox'; 
import EditProduct from './pages/editProduct';
import AddProduct from './pages/AddProduct';
import AdminOrders from './pages/AdminOrders';
import axios from 'axios';

// Components
import Navbar from './components/Navbar'; 
axios.defaults.withCredentials = true;

const App = () => {
  return (
    <div className="min-h-screen bg-white">
      <ToastContainer position="top-center" autoClose={2000} />
      
      <Routes>
        {/* HOME ROUTE: Only place where Navbar and Header appear together */}
        <Route path="/" element={
          <>
            <Home />
          </>
        } />

        {/* LOGIN & AUTH: Completely clean, no Navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* OTHER PAGES: If you want Navbar on Cart/Inbox but NO Header */}
        <Route path="/cart" element={<><Navbar /><div className="pt-20"><CartPage /></div></>} />
        <Route path="/inbox" element={<><Navbar /><div className="pt-20"><Inbox /></div></>} />
        <Route path="/product/:id" element={<><Navbar /><div className="pt-20"><ProductDetails /></div></>} />
        
        {/* ADMIN ROUTES: No Header, maybe a different Sidebar or Navbar later */}
        <Route path="/admin/orders" element={<><Navbar /><div className="pt-20"><AdminOrders /></div></>} />
        <Route path="/admin/add-product" element={<><Navbar /><div className="pt-20"><AddProduct /></div></>} />
        <Route path="/admin/edit-product/:id" element={<><Navbar /><div className="pt-20"><EditProduct /></div></>} />
        
        {/* CHECKOUT: Clean layout for payments */}
        <Route path="/checkout" element={<Checkout />} />

        {/* REVIEW REDIRECT / SUCCESS  */}
        <Route path="/review-success" element={<><Navbar /><div className="pt-20 text-center py-20"><h1 className="text-2xl font-black">Thanks for your review! 🥐</h1></div></>} />
      </Routes>
    </div>
  );
};

export default App;