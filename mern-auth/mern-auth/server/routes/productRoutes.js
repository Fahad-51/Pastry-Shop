import express from "express";
import { 
    showProducts, 
    getProductById, 
    updateProduct, 
    addProduct, 
    deleteProduct,
    createProductReview // Import the new controller function
} from "../controllers/productController.js";
import userAuth from "../middleware/userAuth.js";

const productRouter = express.Router();

// Public Routes
productRouter.get("/home", showProducts);
productRouter.get("/:id", getProductById);

// Review Route (Must be logged in to review)
productRouter.post("/review", userAuth, createProductReview);

// Admin Routes
productRouter.post("/add", addProduct); // Recommend adding adminAuth here
productRouter.put("/update/:id", updateProduct);
productRouter.delete('/delete/:id', deleteProduct);

export default productRouter;