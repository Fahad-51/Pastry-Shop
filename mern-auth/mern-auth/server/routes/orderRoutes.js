import express from 'express';
// 1. Added clearUserInbox to the imports
import { 
    placeOrder, 
    allOrders, 
    updateStatus, 
    userOrders, 
    clearUserInbox 
} from '../controllers/orderController.js';
import userAuth from '../middleware/userAuth.js'; 

const orderRouter = express.Router();

// --- User Routes ---
// This handles the checkout submission
orderRouter.post('/place', userAuth, placeOrder);

// This handles fetching visible orders for the Inbox page
orderRouter.get('/userorders', userAuth, userOrders); 

// 2. FIXED: Changed authUser to userAuth and added the permanent clear route
orderRouter.post('/clear-inbox', userAuth, clearUserInbox);


// --- Admin Routes ---
// Note: Consider creating an adminAuth middleware for these routes later
orderRouter.get('/list', userAuth, allOrders);
orderRouter.post('/status', userAuth, updateStatus);

export default orderRouter;