const express = require("express");
const { body } = require("express-validator");
const verify_token = require("../midleware/verifyToken");
const { create_order, order_verify } = require("../controllers/subscription.controllers");

const router = express.Router();

router.post("/create-order", verify_token, create_order);

router.post(
    "/verify-order",
    verify_token,
    [
        body("razorpay_order_id")
            .trim()
            .notEmpty().withMessage("Order id is required"),

        body("razorpay_payment_id")
            .trim()
            .notEmpty().withMessage("Payment id is required"),

        body("razorpay_signature")
            .trim()
            .notEmpty().withMessage("Signature is required"),
    ],
    order_verify
);

module.exports = router;