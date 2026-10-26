const jwt = require("jsonwebtoken");

const verify_token = async (req, res, next) => {
    try {
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({
                message: "Token not found",
                success: false,
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.token = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid Authentication",
            success: false,
        });
    }
};

module.exports = verify_token;