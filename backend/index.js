
const path = require("path");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const connectDB = require("./db/db");

const adminRoutes = require("./routes/admin.routes");
const categoryRoutes = require("./routes/category.routes");
const newsRoutes = require("./routes/news.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

// core middleware - always goes first
app.use(cors());
app.use(express.json());

// general limiter - protects normal browsing/API usage from being hammered
const general_limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 100,              // 100 requests per minute per IP
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

// strict limiter - only for login and otp routes, where brute-forcing matters most
const auth_limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,                 // only 5 attempts per 15 minutes per IP
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many attempts, please try again later",
        success: false,
    },
});

// apply the strict limiter first, only to the sensitive routes
app.use("/api/user/login-user", auth_limiter);
app.use("/api/user/send-otp", auth_limiter);
app.use("/api/admin/login-admin", auth_limiter);
app.use("/api/admin/send-otp", auth_limiter);

// apply the general limiter to everything else under these paths
app.use("/api/user", general_limiter, userRoutes);
app.use("/api/admin", general_limiter, adminRoutes);
app.use("/api/category", general_limiter, categoryRoutes);
app.use("/api/news", general_limiter, newsRoutes);
app.use("/api/subscription", general_limiter, subscriptionRoutes);

app.use(
    "/uploads",
    express.static(path.join(__dirname, "statics", "uploads"))
);


const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});