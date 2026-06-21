import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";



// Get user Data
export const getUserData = async (req, res) => {
    try {
        const userId = req.user.id; 
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified,
                role: user.role //  ADD THIS: So frontend knows if user is 'admin'
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}
// Change password
export const changePassword = async (req, res) => {

        const {currentPassword, newPassword} =req.body;

    if(!currentPassword || !newPassword)
    {
        return res.json({success: false, message: 'Current password and new password are required'});

    }

    try{

        const userId = req.user.id; 

        const user = await userModel.findById(userId);

        if(!user)
        {
             return res.json({success:false, message: "User not found"})
        }

const isMatch = await bcrypt.compare(currentPassword, user.password);

if(!isMatch)
{
    return res.json({success:false, message: 'Invalid password'})
}

const hashedPassword = await bcrypt.hash(newPassword,10);

user.password=hashedPassword;

await user.save();

return res.json({success: true, message: 'Password has been changed successfully'});
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


