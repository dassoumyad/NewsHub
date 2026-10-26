const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/user.model");
const OTPModel = require("../Models/otp.model");
const generateOTP = require("../services/otpGenerate");

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

        const email = req.body.email.toLowerCase();

        const exist_user = await UserModel.findOne({ email });
        if (exist_user) {
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

// signup - creates the user account after verifying otp
const create_new_user = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const email = req.body.email.toLowerCase();

        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                message: "Email already exists",
                success: false,
            });
        }

        const existingMobile = await UserModel.findOne({ mobile_no: req.body.mobile_no });
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

        await UserModel.create({
            name: req.body.name,
            email,
            mobile_no: req.body.mobile_no,
            password: hashedPassword,
        });

        await OTPModel.deleteMany({ email });

        return res.status(201).json({
            message: "User created successfully",
            success: true,
        });
    } catch (error) {
        console.error("Create User Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// login - checks credentials and returns a jwt
const login_user = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const email = req.body.email.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Account does not exist",
                success: false,
            });
        }

        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Incorrect Password",
                success: false,
            });
        }

        // keep a record of this login
        user.login_history.push(new Date());
        await user.save();

        const payload = {
            user_id: user._id,
            email: user.email,
            mobile_no: user.mobile_no,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "7d",
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

        const email = req.body.email.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (!user) {
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

        const email = req.body.email.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (!user) {
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

        user.password = await bcrypt.hash(req.body.password, 10);
        await user.save();

        await OTPModel.deleteMany({ email });

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

module.exports = {
    sendOTPToEmail,
    create_new_user,
    login_user,
    forgot_password,
    reset_password,
};