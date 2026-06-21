import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // Reference to the User
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Items from the cart
    items: [{
        productId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String }
    }],
    // Financial Details
    amount: { type: Number, required: true },       
    subtotal: { type: Number, required: true },     
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    
    // Address Info (Matches Noakhali district structure)
    address: { 
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        district: { type: String, default: "Noakhali" },
        upazila: { type: String, required: true },
        union: { type: String, required: true },
        streetAddress: { type: String, required: true },
    },

    // Order Specifics
    deliveryDate: { type: String, required: true }, // Chosen by user in Checkout
    specialMessage: { type: String, default: "" },
    
    // Status Flow for Inbox
    status: { 
        type: String, 
        default: 'Pending',
        enum: ['Pending', 'Accepted', 'Processing', 'Delivered', 'Cancelled']
    },

    // Payment Logic
    paymentMethod: { 
        type: String, 
        required: true,
        enum: ['cod', 'bkash', 'nagad'] 
    },
    paymentDetails: {
        transactionId: { type: String, default: "" },
        lastFourDigits: { type: String, default: "" },
    },
    payment: { type: Boolean, default: false }, // true if admin confirms payment

    rejectionReason: { type: String, default: "" },

    // --- ADDED FOR PERMANENT CLEAR ---
    visible: { 
        type: Boolean, 
        default: true 
    },

    // System Timestamps
    date: { type: Number, default: Date.now }
}, { timestamps: true });

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;