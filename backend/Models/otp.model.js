const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        otp: {
            type: String,
            required: true,
        },

        expire_otp_date: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const OTPModel = mongoose.model(
    "nh_otp_details",
    otpSchema
);

module.exports = OTPModel;