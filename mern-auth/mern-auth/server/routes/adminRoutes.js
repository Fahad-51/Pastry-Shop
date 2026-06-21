import express from "express";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  addProduct,
  updateProduct,
  deleteProduct
} from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.post("/add-product", userAuth, adminAuth, addProduct);
adminRouter.put("/update-product/:id", userAuth, adminAuth, updateProduct);
adminRouter.delete("/delete-product/:id", userAuth, adminAuth, deleteProduct);

export default adminRouter;
