const express = require("express");
const { body } = require("express-validator");
const {
    sendOTPToEmail,
    create_new_user,
    login_user,
    forgot_password,
    reset_password,
} = require("../controllers/user.controllers");

const router = express.Router();

router.post(
    "/send-otp",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email address")
            .normalizeEmail(),
    ],
    sendOTPToEmail
);

router.post(
    "/create-user",
    [
        body("name")
            .trim()
            .notEmpty().withMessage("Name is required")
            .isAlpha("en-US", { ignore: " " }).withMessage("Name must contain only letters")
            .isLength({ min: 3, max: 26 }).withMessage("Name must be between 3 and 26 characters"),

        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email address")
            .normalizeEmail(),

        body("mobile_no")
            .trim()
            .notEmpty().withMessage("Mobile number is required")
            .isNumeric().withMessage("Mobile number must contain only numbers")
            .isLength({ min: 10, max: 10 }).withMessage("Mobile number must be 10 digits long"),

        body("password")
            .notEmpty().withMessage("Password is required")
            .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),

        body("confirm_password")
            .notEmpty().withMessage("Confirm password is required")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords do not match");
                }
                return true;
            }),

        body("otp")
            .trim()
            .notEmpty().withMessage("OTP is required")
            .isNumeric().withMessage("OTP must contain only numbers")
            .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits long"),
    ],
    create_new_user
);

router.post(
    "/login-user",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email address")
            .normalizeEmail(),

        body("password")
            .trim()
            .notEmpty().withMessage("Password is required"),
    ],
    login_user
);

router.post(
    "/forgot-password",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email address")
            .normalizeEmail(),
    ],
    forgot_password
);

router.post(
    "/reset-password",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email address")
            .normalizeEmail(),

        body("otp")
            .trim()
            .notEmpty().withMessage("OTP is required")
            .isNumeric().withMessage("OTP must contain only numbers")
            .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits long"),

        body("password")
            .notEmpty().withMessage("Password is required")
            .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),

        body("confirm_password")
            .notEmpty().withMessage("Confirm password is required")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords do not match");
                }
                return true;
            }),
    ],
    reset_password
);

module.exports = router;