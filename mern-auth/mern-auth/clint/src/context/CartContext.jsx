import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { AppContent } from "./AppContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userData, backendUrl } = useContext(AppContent);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- IMAGE HELPER ---
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.png";
    return image.startsWith("http") ? image : `/images/${image}`;
  };

// --- PRICE HELPER (FIXED TO MATCH MODEL) ---
const getDiscountedPrice = (product) => {
  if (!product) return 0;
  
  // 1. Check if discount object exists and isActive is true
  if (!product.discount || !product.discount.isActive) {
    return product.price;
  }

  // 2. IMPORTANT: Your model uses 'type', not 'discountType'
  const { type, value } = product.discount; 
  const price = Number(product.price);
  const discountValue = Number(value);

  // 3. Match the enum values from your model ["percentage", "fixed"]
  if (type === "percentage") {
    // 1000 * (1 - 30/100) = 700
    return Math.round(price * (1 - discountValue / 100));
  } 
  
  if (type === "fixed") {
    // Your model calls it "fixed", previous code called it "fixed"
    return Math.max(0, price - discountValue);
  }

  // Fallback
  return price;
};

  // --- INITIAL LOAD & MERGE LOGIC ---
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];

      if (!userData) {
        // Guest: Just load from localStorage
        setCartItems(localCart);
      } else {
        // Logged In: Merge Guest Cart with Database Cart
        try {
          const res = await axios.post(
            `${backendUrl}/api/cart/merge`,
            { guestItems: localCart },
            { headers: { Authorization: `Bearer ${userData.token}` } }
          );

          if (res.data.success) {
            setCartItems(res.data.items);
            localStorage.removeItem("cart"); // Cleanup local storage after merge
          }
        } catch (error) {
          console.error("Sync Error:", error);
          // Fallback: Fetch existing user cart if merge fails
          try {
            const res = await axios.get(`${backendUrl}/api/cart`, {
              headers: { Authorization: `Bearer ${userData.token}` },
            });
            setCartItems(res.data.items || []);
          } catch (err) {
            console.error("Fetch Error:", err);
          }
        }
      }
      setLoading(false);
    };

    loadCart();
  }, [userData, backendUrl]);

  // --- ADD TO CART ---
  const addToCart = async (product, quantity = 1) => {
    if (userData) {
      // API call for logged-in user
      try {
        const res = await axios.post(
          `${backendUrl}/api/cart/add`,
          { productId: product._id, quantity },
          { headers: { Authorization: `Bearer ${userData.token}` } }
        );
        if (res.data.success) setCartItems(res.data.items);
      } catch (error) {
        alert(error.response?.data?.message || "Error adding to cart");
      }
    } else {
      // LocalStorage logic for guest
      const existingIndex = cartItems.findIndex(
        (item) => (item.product?._id || item.productId) === product._id
      );

      // Limit check (10 unique items for guests)
      if (existingIndex === -1 && cartItems.length >= 10) {
        alert("Cart Limit Reached: 10 types of products max for guests.");
        return;
      }

      let updated;
      if (existingIndex > -1) {
        updated = [...cartItems];
        updated[existingIndex].quantity += quantity;
      } else {
        updated = [...cartItems, { product, productId: product._id, quantity }];
      }
      setCartItems(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
    }
  };

  // --- REMOVE FROM CART ---
  const removeFromCart = async (productId) => {
    if (userData) {
      try {
        const res = await axios.delete(`${backendUrl}/api/cart/remove/${productId}`, {
          headers: { Authorization: `Bearer ${userData.token}` },
        });
        if (res.data.success) setCartItems(res.data.items);
      } catch (error) {
        console.error("Remove Error:", error);
      }
    } else {
      const updated = cartItems.filter(
        (item) => (item.productId || item.product?._id) !== productId
      );
      setCartItems(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
    }
  };

  // --- UPDATE QUANTITY ---
  const updateCartItem = async (productId, quantity) => {
    if (quantity < 1) return;

    if (userData) {
      try {
        const res = await axios.put(
          `${backendUrl}/api/cart/update/${productId}`,
          { quantity },
          { headers: { Authorization: `Bearer ${userData.token}` } }
        );
        if (res.data.success) setCartItems(res.data.items);
      } catch (error) {
        alert(error.response?.data?.message || "Update failed");
      }
    } else {
      const updated = cartItems.map((item) =>
        (item.productId || item.product?._id) === productId
          ? { ...item, quantity }
          : item
      );
      setCartItems(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
    }
  };

// --- CLEAR CART (FIXED) ---
  const clearCart = async () => {
    if (userData) {
      try {
        // API call to clear the cart in the database
        const res = await axios.delete(`${backendUrl}/api/cart/clear`, {
          headers: { Authorization: `Bearer ${userData.token}` },
        });
        if (res.data.success) {
          setCartItems([]);
        }
      } catch (error) {
        console.error("Clear Cart Error:", error);
        alert("Failed to clear cart on server.");
      }
    } else {
      // Guest logic
      setCartItems([]);
      localStorage.removeItem("cart");
    }
  };
  // --- TOTALS CALCULATION ---
  const totals = useMemo(() => {
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const price = cartItems.reduce((sum, item) => {
      const p = item.product ? getDiscountedPrice(item.product) : 0;
      return sum + p * (item.quantity || 1);
    }, 0);
    return { count, price };
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        totalItems: totals.count,
        totalPrice: totals.price,
        loading,
        getImageUrl,
        getDiscountedPrice,
        isLoggedin: !!userData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};