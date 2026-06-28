import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";

// function to calculate total quantity in a cart
const getTotalCartQuantity = (items) => {
  return items.reduce((total, item) => total + (item.quantity || 0), 0);
};



export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    if (!cart) return res.json({ success: true, items: [] });

    const itemsWithCalculatedPrice = cart.items.map(item => {
      const product = item.product;
      const discountedPrice = product.discount 
        ? Math.round(product.price - (product.price * (product.discount / 100))) 
        : product.price;

      return {
        ...item._doc,
        discountedPrice 
      };
    });

    res.json({ success: true, items: itemsWithCalculatedPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// --- ADD PRODUCT TO CART ---
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    // If cart doesn't exist, create it
    if (!cart) {
      const initialQty = Math.min(quantity, 20, product.stock);
      if (initialQty <= 0) {
          return res.status(400).json({ success: false, message: "Cannot add: out of stock or invalid quantity" });
      }
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity: initialQty }],
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      const currentTotalQty = getTotalCartQuantity(cart.items);

      if (itemIndex > -1) {
        // Update existing item
        const existingQty = cart.items[itemIndex].quantity;
        const remainingSpace = 20 - currentTotalQty;
        // We can only add what fits in the 20-limit and what is available in stock
        const canAdd = Math.min(quantity, remainingSpace, product.stock - existingQty);

        if (canAdd <= 0) {
          return res.status(400).json({ success: false, message: "Limit reached or out of stock" });
        }
        cart.items[itemIndex].quantity += canAdd;
      } else {
        // Add new item
        const remainingSpace = 20 - currentTotalQty;
        const canAdd = Math.min(quantity, remainingSpace, product.stock);

        if (canAdd <= 0) {
          return res.status(400).json({ success: false, message: "Cart full or out of stock" });
        }
        cart.items.push({ product: productId, quantity: canAdd });
      }
      await cart.save();
    }

    const updatedCart = await cart.populate("items.product");
    res.json({ success: true, message: "Product added to cart", items: updatedCart.items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- REMOVE PRODUCT FROM CART ---
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    const updatedCart = await cart.populate("items.product");
    res.json({ success: true, message: "Product removed", items: updatedCart.items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- UPDATE PRODUCT QUANTITY ---
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ success: false, message: "Min quantity is 1" });

    const product = await Product.findById(productId);
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: "Product not in cart" });

    const otherItemsQty = cart.items
      .filter(item => item.product.toString() !== productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (otherItemsQty + quantity > 20) {
      return res.status(400).json({ success: false, message: "Total cart items cannot exceed 20" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const updatedCart = await cart.populate("items.product");
    res.json({ success: true, message: "Cart updated", items: updatedCart.items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- MERGE GUEST CART INTO USER CART ---
export const mergeCart = async (req, res) => {
  try {
    const { guestItems } = req.body;
    const userId = req.user.id;

    if (!guestItems || !Array.isArray(guestItems)) {
      return res.status(400).json({ success: false, message: "Invalid guest items" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    for (const gItem of guestItems) {
      const productId = gItem.productId || gItem.product?._id;
      if (!productId) continue;

      const product = await Product.findById(productId);
      if (!product) continue;

      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId.toString()
      );

      const currentTotalQty = getTotalCartQuantity(cart.items);
      const remainingSpace = 20 - currentTotalQty;

      if (existingItem) {
        // Add guest quantity while respecting stock and the 20-limit space
        const canAdd = Math.min(
          gItem.quantity,
          remainingSpace,
          product.stock - existingItem.quantity
        );
        if (canAdd > 0) existingItem.quantity += canAdd;
      } else {
        // Add as new item while respecting space and stock
        if (remainingSpace > 0) {
          const finalQty = Math.min(gItem.quantity, remainingSpace, product.stock);
          if (finalQty > 0) {
            cart.items.push({ product: productId, quantity: finalQty });
          }
        }
      }
    }

    await cart.save();
    const updatedCart = await cart.populate("items.product");

    res.json({ 
      success: true, 
      message: "Cart merged successfully", 
      items: updatedCart.items 
    });
  } catch (error) {
    console.error("Merge Error:", error);
    res.status(500).json({ success: false, message: "Merge Error" });
  }
};

// --- CLEAR ENTIRE CART ---
// Access: Private (Auth User)
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id; // From userAuth middleware

    // Find the cart by user ID and set items to an empty array
    // { new: true } returns the updated document
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true }
    );

    // If for some reason the cart doesn't exist yet, just return success
    if (!cart) {
      return res.status(200).json({ 
        success: true, 
        message: "Cart is already empty", 
        items: [] 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Cart cleared successfully", 
      items: [] 
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: Could not clear cart" 
    });
  }
};

