// models/productModel.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // Reviewer's name
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    productType: {
      type: String,
      required: true,
      enum: ["cake", "sweets", "coffee", "other"], // Added "other" to match default
      default: "other"
    },

    price: {
      type: Number,
      required: true
    },

    discount: {
      isActive: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ["percentage", "flat", "fixed"],
        default: "percentage"
      },
      value: {
        type: Number,
        default: 0
      }
    },

    description: {
      type: String
    },

    image: {
      type: String
    },

    stock: {
      type: Number,
      default: 0
    },

    // These fields must be inside the first curly brace of the Schema
    reviews: [reviewSchema],
    rating: { 
      type: Number, 
      default: 0 
    },
    numReviews: { 
      type: Number, 
      default: 0 
    },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default mongoose.model("Product", productSchema);
