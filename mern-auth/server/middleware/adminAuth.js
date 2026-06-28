// middleware/adminAuth.js

const adminAuth = (req, res, next) => {
  try {
    // userAuth must run before this
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only "
      });
    }

    next(); // user is admin → allow access
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin authorization failed"
    });
  }
};

export default adminAuth;
