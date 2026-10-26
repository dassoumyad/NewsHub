const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        mobile_no: {
            type: String,
            required: true,
            minlength: 10,
            maxlength: 10
        },

        password: {
            type: String,
            required: true,
        },

        // Public payment information only. Never store Razorpay secret keys here.
        payment_details: {
            account_name: { type: String, trim: true, default: "" },
            upi_id: { type: String, trim: true, default: "" },
            payment_link: { type: String, trim: true, default: "" },
        },

        login_history: {
            type: [Date],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Model
const adminModel = mongoose.model(
    "nh_admin_details",
    adminSchema
);

module.exports = adminModel;
