import express from "express";
import { 
    showProducts, 
    getProductById, 
    updateProduct, 
    addProduct, 
    deleteProduct,
    createProductReview,
    deleteProductReview // 1. Import the new delete function
} from "../controllers/productController.js";
import userAuth from "../middleware/userAuth.js";

const productRouter = express.Router();

// Public Routes
productRouter.get("/home", showProducts);
productRouter.get("/:id", getProductById);

// Review Route (Must be logged in to review)
productRouter.post("/review", userAuth, createProductReview);

// Admin Routes
productRouter.post("/add", addProduct); 
productRouter.put("/update/:id", updateProduct);
productRouter.delete('/delete/:id', deleteProduct);

// 2. Add the Review Deletion Route for Admins
// URL matches: /api/products/:id/review/:reviewId
productRouter.delete("/:id/review/:reviewId", deleteProductReview);

export default productRouter;