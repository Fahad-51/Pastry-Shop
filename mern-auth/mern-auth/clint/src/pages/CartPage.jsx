import React, { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateCartItem,
    clearCart,
    isLoggedin,
    getDiscountedPrice,
    backendUrl 
  } = useContext(CartContext);

  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);

  // Calculate total quantity of all items currently in cart
  const totalCartQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Sync selection: if an item is removed from cart, remove it from selectedItems
  useEffect(() => {
    const currentCartIds = cartItems.map(item => item.productId || item.product?._id);
    setSelectedItems(prev => prev.filter(id => currentCartIds.includes(id)));
  }, [cartItems]);

  // --- HANDLERS ---
  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      const allIds = cartItems.map(item => item.productId || item.product?._id);
      setSelectedItems(allIds);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    } else {
      setSelectedItems(prev => [...prev, id]);
    }
  };

  const handleIncreaseQuantity = (productId, currentQty, stock) => {
    if (totalCartQuantity >= 20) {
      toast.warning("Cart limit reached! Max 20 products allowed.");
      return;
    }
    if (currentQty >= stock) {
      toast.error(`Only ${stock} items available in stock.`);
      return;
    }
    updateCartItem(productId, currentQty + 1);
  };

// --- CALCULATIONS ---
  const selectedSubtotal = Math.round(cartItems
    .filter(item => selectedItems.includes(item.productId || item.product?._id))
    .reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0));

  const finalTotal = Math.round(cartItems
    .filter(item => selectedItems.includes(item.productId || item.product?._id))
    .reduce((sum, item) => {
      const discountedPrice = getDiscountedPrice ? getDiscountedPrice(item.product) : item.product?.price || 0;
      return sum + (discountedPrice * item.quantity);
    }, 0));

  const totalDiscountCash = selectedSubtotal - finalTotal;

  // Handle Checkout
  const handleCheckout = () => {
    if (!isLoggedin) {
      toast.info("Please login to proceed to checkout");
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    if (selectedItems.length === 0) {
      toast.warning("Please select at least one item to checkout");
      return;
    }

    navigate("/checkout", { 
      state: { 
        selectedItems, 
        subtotal: finalTotal 
      } 
    });
  };

  // Empty State UI
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your cart is feeling light</h2>
        <p className="text-gray-500 mb-8 max-w-sm">It looks like you haven't added any treats yet.</p>
        <button className="px-8 py-3 bg-slate-900 text-white rounded-full font-semibold hover:bg-rose-600 transition-all shadow-lg" onClick={() => navigate("/")}>
          Explore Our Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-6 pb-20 lg:pt-10">
      <button onClick={() => navigate("/")} className="group flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-rose-600 transition-colors mb-8">
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Shopping Bag</h1>
        <div className="bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
           <p className="text-rose-600 text-xs font-bold uppercase tracking-widest">
             Cart Capacity: {totalCartQuantity} / 20 items
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={cartItems.length > 0 && selectedItems.length === cartItems.length} onChange={handleSelectAll} className="w-5 h-5 accent-rose-600 rounded cursor-pointer" />
              <p className="text-gray-900 font-bold text-sm">Select All</p>
            </div>
            <button className="text-xs text-rose-500 font-bold hover:text-rose-700 uppercase tracking-wider" onClick={clearCart}>
              Remove All
            </button>
          </div>

          <div className="space-y-8">
            {cartItems.map((item) => {
              const productId = item.productId || item.product?._id;
              const name = item.product?.name || "Premium Product";
              const originalPrice = item.product?.price || 0;
              const stock = item.product?.stock || 0;
              const discountedPrice = getDiscountedPrice ? getDiscountedPrice(item.product) : originalPrice;
              const imageUrl = item.product?.image ? (item.product.image.startsWith("http") ? item.product.image : `${backendUrl}/images/${item.product.image}`) : "/placeholder.png";

              return (
                <div key={productId} className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group">
                  <div className="w-full sm:w-auto flex justify-start">
                    <input type="checkbox" checked={selectedItems.includes(productId)} onChange={() => handleSelectItem(productId)} className="w-5 h-5 accent-rose-600 rounded cursor-pointer" />
                  </div>

                  <div className="w-full sm:w-32 h-32 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 flex-shrink-0 relative">
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = "/placeholder.png" }} />
                    {stock <= 5 && (
                      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md text-[8px] font-black text-rose-600 uppercase">
                        Only {stock} left
                      </div>
                    )}
                  </div>

                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-rose-600 transition-colors">{name}</h3>
                    <p className="text-gray-400 text-sm mb-4">Stock: {stock} pieces available</p>
                    <button onClick={() => removeFromCart(productId)} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-rose-600 flex items-center gap-1 mx-auto sm:mx-0 transition-colors">
                      <span>✕</span> Remove
                    </button>
                  </div>

                  <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100 shadow-sm">
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-gray-400 hover:text-rose-600 disabled:opacity-30"
                      onClick={() => updateCartItem(productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >—</button>
                    <span className="w-10 text-center font-black text-gray-800">{item.quantity}</span>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-gray-400 hover:text-rose-600 disabled:opacity-20 disabled:cursor-not-allowed"
                      onClick={() => handleIncreaseQuantity(productId, item.quantity, stock)}
                      disabled={item.quantity >= stock || totalCartQuantity >= 20}
                    >+</button>
                  </div>

                  <div className="sm:w-28 text-right">
                    <p className="text-xl font-black text-gray-900">৳{(discountedPrice * item.quantity).toLocaleString()}</p>
                    {originalPrice > discountedPrice && (
                      <p className="text-xs text-gray-400 line-through">৳{(originalPrice * item.quantity).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Summary Sidebar */}
        <aside className="bg-slate-50 p-8 rounded-[2.5rem] sticky top-28 border border-slate-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Summary</h2>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-gray-500 font-medium text-sm">
              <span>Selected Subtotal</span>
              <span className="text-gray-900 font-bold">৳{selectedSubtotal.toLocaleString()}</span>
            </div>
            
            {/* FIX: Improved Discount Display */}
            {totalDiscountCash > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium text-sm">
                <span>
                  Discount 
                  {cartItems.find(i => selectedItems.includes(i.productId || i.product?._id))?.product?.discount?.discountType === 'percentage' 
                    ? ` (${cartItems.find(i => selectedItems.includes(i.productId || i.product?._id)).product.discount.value}%)` 
                    : ''}
                </span>
                <span className="font-bold">-৳{totalDiscountCash.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-6 mt-4 border-t border-dashed border-gray-300 flex justify-between items-end">
              <span className="text-gray-900 font-bold">Total Amount</span>
              <span className="text-3xl font-black text-gray-900">৳{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              disabled={selectedItems.length === 0}
              className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-rose-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={handleCheckout} 
            >
              {isLoggedin ? "Checkout Now" : "Login to Checkout"}
            </button>
            <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest pt-2">
              🔒 SSL Secure Checkout
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;