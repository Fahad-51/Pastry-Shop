import Product from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

// Add or Update a review
export const createProductReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body;
        const userId = req.body.userId; // Usually from userAuth middleware req.userId
        const userName = req.body.userName; 

        // 1. Verify delivery status
        const hasPurchased = await orderModel.findOne({
            userId,
            status: "Delivered",
            "items.productId": productId
        });

        if (!hasPurchased) {
            return res.status(400).json({ success: false, message: "Only delivered products can be reviewed." });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        // 2. Check for existing review 
        const alreadyReviewed = product.reviews.find(r => r.userId.toString() === userId.toString());

        if (alreadyReviewed) {
            alreadyReviewed.rating = Number(rating);
            alreadyReviewed.comment = comment;
        } else {
            const review = { name: userName, rating: Number(rating), comment, userId };
            product.reviews.push(review);
        }

        // 3. Update stats
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();
        res.status(201).json({ success: true, message: "Review saved!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Show Home page 
export const showProducts = async (req, res) => {
    try {
        const allProducts = await Product.find({});
        const productsWithDiscount = allProducts.map(product => {
            let discountedPrice = product.price;
            if (product.discount?.isActive) {
                const val = product.discount.value;
                discountedPrice = product.discount.type === "percentage" 
                    ? Math.round(product.price - (product.price * (val / 100))) 
                    : product.price - val;
            }
            return { ...product._doc, discountedPrice };
        });
        res.json({ success: true, products: productsWithDiscount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product by ID 
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addProduct = async (req, res) => {
    try {
        const { name, price, description, productType, stock, image, discount } = req.body;
        if (!name || !price || !productType) {
            return res.json({ success: false, message: "Required fields are missing." });
        }
        const newProduct = new Product({ name, price, description, productType, stock, image, discount });
        await newProduct.save();
        res.status(201).json({ success: true, message: "Product added successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, message: "Product updated!", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) return res.json({ success: false, message: "Product not found" });
        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- NEW FUNCTION: DELETE A SPECIFIC REVIEW ---
export const deleteProductReview = async (req, res) => {
    try {
        const { id, reviewId } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Verify review exists before filtering it out
        const reviewExists = product.reviews.find(r => r._id.toString() === reviewId);
        if (!reviewExists) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Filter out the review matching the provided reviewId
        product.reviews = product.reviews.filter(r => r._id.toString() !== reviewId);

        // Update overall counters and metrics
        product.numReviews = product.reviews.length;
        
        if (product.numReviews > 0) {
            product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
        } else {
            product.rating = 0;
        }

        await product.save();
        res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};