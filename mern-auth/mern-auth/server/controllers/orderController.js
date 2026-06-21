import orderModel from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js"; 

// --- USER: Place a new order ---
// This handles stock reduction and cart clearing
export const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { 
            items, 
            amount, 
            subtotal, 
            deliveryDate, 
            address, 
            paymentMethod, 
            paymentDetails 
        } = req.body;

        // 1. VALIDATE STOCK & REDUCE IT
        // We iterate through items to ensure availability before saving the order
        for (const item of items) {
            const product = await productModel.findById(item.productId);
            
            if (!product) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Product ${item.name || 'Unknown'} not found.` 
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock! Only ${product.stock} pieces of ${product.name} available.` 
                });
            }

            // Decrement the stock count
            product.stock -= item.quantity;
            await product.save();
        }

        // 2. PREPARE ORDER DATA
        const orderData = {
            userId,
            items,
            address,
            amount,
            subtotal,
            deliveryDate,
            paymentMethod,
            paymentDetails: paymentDetails || {},
            payment: paymentMethod === 'cod' ? false : true,
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // 3. CLEAR USER CART
        await Cart.findOneAndUpdate({ user: userId }, { items: [] });

        res.json({ success: true, message: "Order Placed Successfully!" });

    } catch (error) {
        console.error("Order Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// --- ADMIN: List all orders ---
// This was the missing export causing your SyntaxError
export const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Fetch All Orders Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADMIN: Update order status ---
// Includes logic to return stock to inventory if an order is cancelled
export const updateStatus = async (req, res) => {
    try {
        const { orderId, status, rejectionReason } = req.body;
        
        const updateData = { status };
        
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // IF CANCELLED: Restore the stock to the products
        if (status === 'Cancelled' && order.status !== 'Cancelled') {
            for (const item of order.items) {
                await productModel.findByIdAndUpdate(item.productId, {
                    $inc: { stock: item.quantity }
                });
            }
            updateData.rejectionReason = rejectionReason || "Order cancelled by store.";
            updateData.payment = false;
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        );
        
        res.json({ 
            success: true, 
            message: `Status updated to ${status}`, 
            order: updatedOrder 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- USER: Get orders for the logged-in user ---
export const userOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await orderModel.find({ userId }).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.error("User Orders Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- USER: Hide orders from inbox ---
export const clearUserInbox = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        // Sets visibility to false without deleting the record from DB
        await orderModel.updateMany({ userId }, { visible: false });

        res.json({ success: true, message: "Inbox Cleared Successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};