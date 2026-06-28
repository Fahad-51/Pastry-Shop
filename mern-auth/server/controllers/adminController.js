// controllers/adminController.js
import Product from "../models/productModel.js";

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      productType,
      price,
      description,
      discount,
      image,
      stock
    } = req.body;

    if (!name || price == null) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required"
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative"
      });
    }

    if (stock != null && stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative"
      });
    }

    // Discount validation
    if (discount?.isActive) {
      if (discount.value <= 0) {
        return res.status(400).json({
          success: false,
          message: "Discount value must be greater than 0"
        });
      }

      if (
        discount.type === "percentage" &&
        discount.value > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount cannot exceed 100"
        });
      }
    }

    const product = await Product.create({
      name,
      productType,
      price,
      description,
      discount,
      image,
      stock
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message
    });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });
  }
};
