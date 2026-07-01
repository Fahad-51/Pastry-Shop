import mongoose from "mongoose";
import dotenv from 'dotenv';

const connectDB = async () => {
    try {
        // Event listener for a successful connection
        mongoose.connection.on('connected', () => console.log("Database Connected Successfully"));
        
        // Handle connection errors after initial connection
        mongoose.connection.on('error', (err) => console.error("MongoDB connection error:", err));

        // FIX: Pass 'mern-auth' inside the options object instead of appending it to the string
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'mern-auth'
        });
        
    } catch (error) {
        console.error("Initial database connection failed:", error.message);
        process.exit(1); // Stop the server if the database fails to connect
    }
};

export default connectDB;
