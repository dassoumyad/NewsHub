const AdminModel = require("../Models/admin.model");
const verify_token = require("./verifyToken");

// Authentication (401) and authorization (403) are intentionally separate:
// a valid normal-user JWT must never authorize an admin request.
const require_admin = (req, res, next) => {
    verify_token(req, res, async () => {
        try {
            const admin = await AdminModel.findOne({
                _id: req.token.user_id,
                email: req.token.email,
            });

            if (!admin) {
                return res.status(403).json({
                    message: "Admin permission required",
                    success: false,
                });
            }

            req.admin = admin;
            return next();
        } catch (error) {
            console.error("Admin Authorization Error:", error);
            return res.status(403).json({
                message: "Admin permission required",
                success: false,
            });
        }
    });
};

module.exports = require_admin;
