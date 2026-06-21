import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContent } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import logo from "../assets/logo.png"; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    userData, 
    setUserData, 
    setIsLoggedin, 
    backendUrl, 
    activeCategory, 
    setActiveCategory 
  } = useContext(AppContent);
  
  const { totalItems } = useContext(CartContext);
  
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Check if current user is an admin
  const isAdmin = userData?.role === 'admin';

  const handleClickOutside = useCallback((e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, handleClickOutside]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleNavClick = (categoryID) => {
    setActiveCategory(categoryID);
    if (location.pathname !== '/') {
      navigate('/');
    }
    setTimeout(() => {
      const section = document.getElementById('product-list');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const sendVerificationOtp = async () => {
    if (isSendingOtp) return;
    try {
      setIsSendingOtp(true);
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendUrl}/api/auth/send-verify-otp`);
      if (data.success) {
        navigate('/verify-email');
        toast.success(data.message || "Verification code sent!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLogout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendUrl}/api/auth/logout`);
      if (data.success) {
        setIsLoggedin(false);
        setUserData(null);
        navigate('/');
        toast.info("Logged out successfully");
      }
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <nav className="w-full h-20 flex items-center justify-between px-6 md:px-16 lg:px-24 fixed top-0 left-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      
      {/* Brand Logo & Name */}
      <div 
        className="flex items-center gap-2 cursor-pointer group" 
        onClick={() => handleNavClick("All")}
      >
        <img
          src={logo}
          alt="Frosty Pastry Icon"
          className="h-16 w-auto object-contain transition-transform group-active:scale-90"
        />
      </div>

      {/* Navigation Links (Desktop) */}
      <div className="hidden md:flex items-center gap-8">
        {['All', 'cake', 'sweets', 'coffee'].map((cat) => (
          <button 
            key={cat}
            onClick={() => handleNavClick(cat)} 
            className={`text-sm font-bold capitalize transition-colors ${activeCategory === cat ? "text-pink-600" : "text-gray-600 hover:text-pink-500"}`}
          >
            {cat === "All" ? "Home" : cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        
        {/* --- CONDITIONAL ICON: ADMIN vs USER --- */}
{isAdmin ? (
  /* Admin View: Show Pending Orders Icon */
  <button 
    onClick={() => navigate('/admin/orders')} 
    className="relative p-2.5 rounded-full hover:bg-indigo-50 transition-colors group border border-indigo-100"
    title="Pending Orders"
  >
    <span className="text-xl group-hover:scale-110 transition-transform inline-block">📋</span>
    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black px-1 rounded-full uppercase">Admin</span>
  </button>
) : (
  /* User View: Show Inbox and Shopping Cart */
  <div className="flex items-center gap-2">
    
    {/* 📩 Inbox Icon (Only if logged in) */}
    {userData && (
      <button 
        onClick={() => navigate('/inbox')} 
        className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors group"
        title="Inbox"
      >
        <img 
          src={assets.mail_icon} 
          alt="Inbox" 
          className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" 
        />
        {/* Blue notification dot */}
        <span className="absolute top-2.5 right-2.5 bg-blue-500 w-2 h-2 rounded-full border border-white"></span>
      </button>
    )}

    {/* 🛒 Shopping Cart */}
    <button 
      onClick={() => navigate('/cart')} 
      className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors group"
      title="Cart"
    >
      <span className="text-xl group-hover:scale-110 transition-transform inline-block">🛒</span>
      {totalItems > 0 && (
        <span className="absolute top-1 right-1 bg-pink-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
          {totalItems}
        </span>
      )}
    </button>
  </div>
)}
        {/* User Interaction Area */}
        {userData ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-gray-200 hover:border-pink-300 hover:bg-pink-50/30 transition-all shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-medium text-gray-700 max-w-[100px] truncate">
                {userData.name}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-xs text-gray-500 uppercase font-bold">Account</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{userData.email}</p>
                </div>
                <ul className="py-1">
                  {/* Admin Specific Links */}
                  {isAdmin && (
                    <>
                      <li onClick={() => navigate('/admin/orders')} className="px-4 py-3 flex items-center gap-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 cursor-pointer">
                        <span>📋</span> Manage Orders
                      </li>
                      <li onClick={() => navigate('/admin/add-product')} className="px-4 py-3 flex items-center gap-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 cursor-pointer">
                        <span>➕</span> Add Product
                      </li>
                    </>
                  )}
                  
                  <li
                    onClick={!isSendingOtp ? sendVerificationOtp : null}
                    className={`px-4 py-3 flex items-center gap-2 text-sm transition-colors ${
                      isSendingOtp ? 'text-gray-400 cursor-wait' : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600 cursor-pointer'
                    }`}
                  >
                    <span>🛡️</span> {isSendingOtp ? 'Sending code...' : 'Verify Email'}
                  </li>
                  <li
                    onClick={handleLogout}
                    className="px-4 py-3 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer border-t border-gray-50"
                  >
                    <span>🚪</span> Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-slate-900 text-white rounded-full px-7 py-2.5 font-medium hover:bg-slate-800 transition-all active:scale-95"
          >
            Login
            <img src={assets.arrow_icon} alt="" className="w-3.5 h-3.5 invert" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;