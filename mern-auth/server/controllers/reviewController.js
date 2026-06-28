// controllers/reviewController.js
import Product from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

export const addOrUpdateReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body;
        const userId = req.user._id; // Assuming you have auth middleware
        const userName = req.user.name;

        // 1. Check if the user has a DELIVERED order containing this product
        const deliveredOrder = await orderModel.findOne({
            userId: userId,
            status: 'Delivered',
            "items.productId": productId
        });

        if (!deliveredOrder) {
            return res.status(400).json({ 
                success: false, 
                message: "You can only review products from delivered orders." 
            });
        }

        const product = await Product.findById(productId);

        if (product) {
            // Check if user already reviewed this product
            const alreadyReviewed = product.reviews.find(
                (r) => r.userId.toString() === userId.toString()
            );

            if (alreadyReviewed) {
                // Update existing review
                alreadyReviewed.rating = Number(rating);
                alreadyReviewed.comment = comment;
            } else {
                // Create new review
                const review = {
                    name: userName,
                    rating: Number(rating),
                    comment,
                    userId: userId,
                };
                product.reviews.push(review);
                product.numReviews = product.reviews.length;
            }

            // Recalculate average rating
            product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

            await product.save();
            res.status(201).json({ success: true, message: "Review added/updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};