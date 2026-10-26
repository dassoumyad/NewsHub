const { validationResult } = require("express-validator");
const Razorpay = require("razorpay");
const { validatePaymentVerification } = require("razorpay/dist/utils/razorpay-utils");
const SubscriptionModel = require("../Models/subscription.model");
const UserModel = require("../Models/user.model");
const sendSubscriptionConfirmationEmail = require("../services/subscriptionConfirmationEmail");

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

// step 1 - create a razorpay order for the subscription
const create_order = async (req, res) => {
    try {
        const exist_user = await UserModel.findOne({ _id: req.token.user_id });
        if (!exist_user) {
            return res.status(400).json({
                message: "Account does not exist",
                success: false,
            });
        }

        // block only if they already have a subscription that hasn't expired yet
        const exist_subscription = await SubscriptionModel.findOne({ user_id: exist_user._id });
        if (exist_subscription && exist_subscription.subscription_end_date > new Date()) {
            return res.status(400).json({
                message: "Subscription already purchased",
                success: false,
            });
        }

        const order = await instance.orders.create({
            amount: Math.round(Number(process.env.SUBSCRIPTION_PRICE) * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
                plan: `1 year subscription of Newshub - Rs ${process.env.SUBSCRIPTION_PRICE}`,
            },
        });

        return res.status(200).json({
            message: "Order Created Successfully",
            key_id: process.env.RAZORPAY_ID,
            order,
            success: true,
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// step 2 - verify the payment, then either create a fresh subscription or renew the existing one
const order_verify = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const exist_user = await UserModel.findOne({ _id: req.token.user_id });
        if (!exist_user) {
            return res.status(400).json({
                message: "Account does not exist",
                success: false,
            });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const is_valid = validatePaymentVerification(
            { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
            razorpay_signature,
            process.env.RAZORPAY_SECRET
        );

        if (!is_valid) {
            return res.status(400).json({
                message: "Invalid payment",
                success: false,
            });
        }

        // block a repeat payment if they already have an active (non-expired) subscription
        const exist_subscription = await SubscriptionModel.findOne({ user_id: exist_user._id });
        if (exist_subscription && exist_subscription.subscription_end_date > new Date()) {
            return res.status(400).json({
                message: "Subscription already purchased",
                success: false,
            });
        }

        const start_date = new Date();
        const end_date = new Date();
        end_date.setFullYear(end_date.getFullYear() + 1);

        let subscription;
        let response_message;
        if (exist_subscription) {
            // they had a subscription before, but it expired - renew it
            exist_subscription.razorpay_payment_id = razorpay_payment_id;
            exist_subscription.razorpay_order_id = razorpay_order_id;
            exist_subscription.razorpay_signature = razorpay_signature;
            exist_subscription.subscription_start_date = start_date;
            exist_subscription.subscription_end_date = end_date;
            exist_subscription.amount = Number(process.env.SUBSCRIPTION_PRICE);
            exist_subscription.status = "Active";

            subscription = await exist_subscription.save();
            response_message = "Subscription renewed successfully";
        } else {
            // first time subscribing - create a brand new record
            subscription = await SubscriptionModel.create({
                user_id: exist_user._id,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                subscription_start_date: start_date,
                subscription_end_date: end_date,
                amount: Number(process.env.SUBSCRIPTION_PRICE),
            });
            response_message = "Payment verified and subscription activated";
        }

        // A mail failure must never undo a verified payment or block access.
        void sendSubscriptionConfirmationEmail(exist_user, subscription).catch(() => {
            console.error("Subscription confirmation email could not be queued.");
        });

        return res.status(200).json({
            message: response_message,
            success: true,
        });
    } catch (error) {
        console.error("Verify Order Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

module.exports = {
    create_order,
    order_verify,
};
