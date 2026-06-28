import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import userModel from "../models/userModel.js";
import transporter from '../config/nodemailer.js';


const sendResponse = (res, status, success, message, extra = {}) => {
    return res.status(status).json({ success, message, ...extra });
};

// --- REGISTER ---
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return sendResponse(res, 400, false, 'Missing Details');
    }

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return sendResponse(res, 400, false, 'User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Welcome to Frosty Pastry',
            text: `Hello ${name},\n\nWelcome to Frosty Pastry! 🎉\nEnjoy our freshly baked pastries!\n\n- Team Frosty Pastry`
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailErr) {
            console.error("Welcome Email failed:", emailErr.message);
        }

        return sendResponse(res, 201, true, "Registered successfully");

    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// --- LOGIN ---
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendResponse(res, 400, false, 'Email and password are required');
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) return sendResponse(res, 404, false, 'Invalid email');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendResponse(res, 401, false, 'Invalid password');

        // Admin check
        if (email === process.env.ADMIN_EMAIL && user.role !== "admin") {
            user.role = "admin";
            await user.save();
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return sendResponse(res, 200, true, "Login successful", {
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        return sendResponse(res, 500, false, error.message);
    }
};

// --- LOGOUT ---
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return sendResponse(res, 200, true, "Logged Out");
    } catch (error) {
        return sendResponse(res, 500, false, error.message);
    }
};

// --- SEND VERIFY OTP (Email verification) ---
export const sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return sendResponse(res, 400, false, "Account Already Verified");
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        // hashed OTP for security
        user.verifyOtp = await bcrypt.hash(otp, 10);
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this code.`
        });

        return sendResponse(res, 200, true, 'Verification OTP sent to email');
    } catch (error) {
        return sendResponse(res, 500, false, error.message);
    }
};

// --- VERIFY EMAIL ---
export const verifyEmail = async (req, res) => {
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) return sendResponse(res, 400, false, 'Missing OTP');

    try {
        const user = await userModel.findById(userId);
        if (!user) return sendResponse(res, 404, false, "User not found");

        if (!user.verifyOtp || user.verifyOtpExpireAt < Date.now()) {
            return sendResponse(res, 400, false, 'OTP Expired or not found');
        }

        const isMatch = await bcrypt.compare(otp, user.verifyOtp);
        if (!isMatch) return sendResponse(res, 400, false, 'Invalid OTP');

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        return sendResponse(res, 200, true, 'Email Verified Successfully');
    } catch (error) {
        return sendResponse(res, 500, false, error.message);
    }
};

// --- SEND PASSWORD RESET OTP ---
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return sendResponse(res, 400, false, "Email is required");

    try {
        const user = await userModel.findOne({ email });
        if (!user) return sendResponse(res, 404, false, 'User not found');

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        // FIX: Hash the reset OTP as well
        user.resetOtp = await bcrypt.hash(otp, 10);
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP is ${otp}. Use this to reset your password. Valid for 15 mins.`
        });

        return sendResponse(res, 200, true, 'Password reset OTP sent to email');
    } catch (error) {
        return sendResponse(res, 500, false, error.message);
    }
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!otp || !email || !newPassword) {
        return sendResponse(res, 400, false, 'Email, OTP, and new password are required');
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) return sendResponse(res, 404, false, "User not found");

        if (!user.resetOtp || user.resetOtpExpireAt < Date.now()) {
            return sendResponse(res, 400, false, 'OTP Expired');
        }

        // Validate hashed OTP
        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) return sendResponse(res, 400, false, 'Invalid OTP');

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        await user.save();

        return sendResponse(res, 200, true, 'Password has been reset successfully');
    } catch (error) {
        return sendResponse(res, 500, false, error.message);
    }
};

// --- AUTH CHECK ---
export const isAuthenticated = async (req, res) => {
    return sendResponse(res, 200, true, "Authenticated");
};