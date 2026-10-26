const express = require("express");
const { body } = require("express-validator");
const {
    login_admin,
    forgot_password,
    reset_password,
    setup_admin,
} = require("../controllers/admin.controllers");

const router = express.Router();

router.post(
    "/setup-admin",
    [
        body("name").trim().notEmpty().isLength({ min: 3, max: 80 }),
        body("email").trim().isEmail().normalizeEmail(),
        body("mobile_no").trim().isNumeric().isLength({ min: 10, max: 10 }),
        body("password").notEmpty().isLength({ min: 8 }),
        body("confirm_password").custom((value, { req }) => value === req.body.password),
        body("payment_details.account_name").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
        body("payment_details.upi_id").optional({ values: "falsy" }).trim().matches(/^[\w.-]+@[\w.-]+$/),
        body("payment_details.payment_link").optional({ values: "falsy" }).trim().isURL({ protocols: ["http", "https"], require_protocol: true }),
    ],
    setup_admin
);

router.post(
    "/login-admin",
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
    login_admin
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
