const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminModel = require("../Models/admin.model");
const OTPModel = require("../Models/otp.model");
const generateOTP = require("../services/otpGenerate");

const normalize_admin_email = (value) => String(value || "").trim().toLowerCase();

function log_admin_lookup(event, details) {
    if (process.env.NODE_ENV === "development") {
        console.info(`[admin-auth] ${event}`, {
            ...details,
            database: AdminModel.db.name,
            collection: AdminModel.collection.name,
        });
    }
}

// send otp before signup
const sendOTPToEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Error",
                errors: errors.array(),
                success: false,
            });
        }

        const email = normalize_admin_email(req.body.email);

        const exist_email = await AdminModel.findOne({ email });
        if (exist_email) {
            return res.status(400).json({
                message: "Email Already Exists",
                success: false,
            });
        }

        const otpSent = await generateOTP(email);
        if (!otpSent) {
            return res.status(500).json({
                message: "Failed To Send OTP",
                success: false,
            });
        }

        return res.status(200).json({
            message: "OTP Sent Successfully",
            success: true,
        });
    } catch (error) {
        console.error("Send OTP Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// signup - creates the admin after verifying otp
const create_new_admin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const email = normalize_admin_email(req.body.email);

        const existingEmail = await AdminModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                message: "Email already exists",
                success: false,
            });
        }

        const existingMobile = await AdminModel.findOne({ mobile_no: req.body.mobile_no });
        if (existingMobile) {
            return res.status(400).json({
                message: "Mobile number already exists",
                success: false,
            });
        }

        if (req.body.password !== req.body.confirm_password) {
            return res.status(400).json({
                message: "Passwords do not match",
                success: false,
            });
        }

        const exist_otp = await OTPModel.findOne({ email }).sort({ createdAt: -1 });
        if (!exist_otp) {
            return res.status(400).json({
                message: "Please Generate OTP First",
                success: false,
            });
        }

        if (new Date() > new Date(exist_otp.expire_otp_date)) {
            return res.status(400).json({
                message: "OTP Expired. Please Generate a New OTP",
                success: false,
            });
        }

        if (exist_otp.otp !== req.body.otp) {
            return res.status(400).json({
                message: "Invalid OTP",
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newAdmin = new AdminModel({
            name: req.body.name,
            email,
            mobile_no: req.body.mobile_no,
            password: hashedPassword,
            payment_details: {
                account_name: req.body.payment_details?.account_name || "",
                upi_id: req.body.payment_details?.upi_id || "",
                payment_link: req.body.payment_details?.payment_link || "",
            },
            login_history: [],
        });

        await newAdmin.save();
        // await OTPModel.deleteMany({ email });

        return res.status(201).json({
            message: "Admin created successfully",
            success: true,
        });
    } catch (error) {
        console.error("Create admin error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// login - checks credentials and returns a jwt
const login_admin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const email = normalize_admin_email(req.body.email);

        const admin = await AdminModel.findOne({ email });
        log_admin_lookup("login", { email, adminRecordExists: Boolean(admin) });
        if (!admin) {
            return res.status(400).json({
                message: "Account does not exist",
                success: false,
            });
        }

        const isPasswordCorrect = await bcrypt.compare(req.body.password, admin.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Incorrect Password",
                success: false,
            });
        }

        const payload = {
            user_id: admin._id,
            email: admin.email,
            mobile_no: admin.mobile_no,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1d",
        });

        return res.status(200).json({
            message: "Login successful",
            success: true,
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// forgot password step 1 - send otp to a registered email
const forgot_password = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Error",
                errors: errors.array(),
                success: false,
            });
        }

        const email = normalize_admin_email(req.body.email);

        const admin = await AdminModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                message: "Account does not exist",
                success: false,
            });
        }

        const otpSent = await generateOTP(email);
        if (!otpSent) {
            return res.status(500).json({
                message: "Failed To Send OTP",
                success: false,
            });
        }

        return res.status(200).json({
            message: "OTP Sent Successfully",
            success: true,
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// forgot password step 2 - verify otp and set the new password
const reset_password = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Error",
                errors: errors.array(),
                success: false,
            });
        }

        const email = normalize_admin_email(req.body.email);

        const admin = await AdminModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                message: "Account does not exist",
                success: false,
            });
        }

        if (req.body.password !== req.body.confirm_password) {
            return res.status(400).json({
                message: "Passwords do not match",
                success: false,
            });
        }

        const exist_otp = await OTPModel.findOne({ email }).sort({ createdAt: -1 });
        if (!exist_otp) {
            return res.status(400).json({
                message: "Please Generate OTP First",
                success: false,
            });
        }

        if (new Date() > new Date(exist_otp.expire_otp_date)) {
            return res.status(400).json({
                message: "OTP Expired. Please Generate a New OTP",
                success: false,
            });
        }

        if (exist_otp.otp !== req.body.otp) {
            return res.status(400).json({
                message: "Invalid OTP",
                success: false,
            });
        }

        admin.password = await bcrypt.hash(req.body.password, 10);
        await admin.save();
        // await OTPModel.deleteMany({ email });

        return res.status(200).json({
            message: "Password changed successfully",
            success: true,
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// Expose only payment fields that admins choose to share publicly.
const fetch_payment_details = async (req, res) => {
    try {
        const admins = await AdminModel.find({
            $or: [
                { "payment_details.payment_link": { $exists: true, $ne: "" } },
                { "payment_details.upi_id": { $exists: true, $ne: "" } },
            ],
        }).select("name payment_details.account_name payment_details.upi_id payment_details.payment_link");

        return res.status(200).json({
            message: "Payment details fetched successfully",
            success: true,
            data: admins,
        });
    } catch (error) {
        console.error("Fetch Payment Details Error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Protected first-admin setup. The route is unusable without ADMIN_SETUP_KEY
// and is closed automatically after the first admin is created.
const setup_admin = async (req, res) => {
    try {
        if (!process.env.ADMIN_SETUP_KEY || req.headers["x-admin-setup-key"] !== process.env.ADMIN_SETUP_KEY) {
            return res.status(403).json({ message: "Invalid admin setup key", success: false });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation error", errors: errors.array(), success: false });
        }

        const adminCount = await AdminModel.countDocuments({});
        log_admin_lookup("setup-check", {
            adminRecordExists: adminCount > 0,
            adminCount,
        });

        if (adminCount > 0) {
            return res.status(409).json({ message: "Admin setup is already complete", success: false });
        }

        const email = normalize_admin_email(req.body.email);
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await AdminModel.create({
            name: req.body.name,
            email,
            mobile_no: req.body.mobile_no,
            password: hashedPassword,
            payment_details: {
                account_name: req.body.payment_details?.account_name || "",
                upi_id: req.body.payment_details?.upi_id || "",
                payment_link: req.body.payment_details?.payment_link || "",
            },
        });

        return res.status(201).json({ message: "Admin account created successfully", success: true });
    } catch (error) {
        console.error("Admin Setup Error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

module.exports = {
    sendOTPToEmail,
    create_new_admin,
    login_admin,
    forgot_password,
    reset_password,
    fetch_payment_details,
    setup_admin,
};
