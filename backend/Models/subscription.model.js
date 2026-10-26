const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "nh_user_details",
            required: true,
        },

        razorpay_payment_id: {
            type: String,
            required: true,
            trim: true,
        },

        razorpay_order_id: {
            type: String,
            required: true,
            trim: true,
        },

        razorpay_signature: {
            type: String,
            required: true,
            trim: true,
        },

        subscription_start_date: {
            type: Date,
            required: true,
        },

        subscription_end_date: {
            type: Date,
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

const subscriptionModel = mongoose.model("nh_subscription_details", subscriptionSchema);

module.exports = subscriptionModel;