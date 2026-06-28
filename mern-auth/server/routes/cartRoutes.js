import express from "express";
import { 
  addToCart, 
  getCart, 
  removeFromCart, 
  updateCartItem, 
  mergeCart,
  clearCart 
} from "../controllers/cartController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();


// GET /api/cart/
router.get("/", userAuth, getCart);


// POST /api/cart/add
router.post("/add", userAuth, addToCart);


// PUT /api/cart/update/:productId
router.put("/update/:productId", userAuth, updateCartItem);


// DELETE /api/cart/remove/:productId
router.delete("/remove/:productId", userAuth, removeFromCart);


// POST /api/cart/merge
router.post("/merge", userAuth, mergeCart);


// DELETE /api/cart/clear
router.delete("/clear", userAuth, clearCart); 

export default router;