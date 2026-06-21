import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import 'dotenv/config';
import connectDB from './config/mongodb.js';

// Routes
import authRouter from './routes/authRoutes.js';
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from './routes/orderRoutes.js';


const app = express();
const port = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Allowed origins for CORS
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Health check route
app.get('/', (req, res) => res.send("API Working fine!"));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

// Start server
app.listen(port, () => console.log(`Server started on PORT: ${port}`));
