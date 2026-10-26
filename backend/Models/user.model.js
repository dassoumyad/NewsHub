const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
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
    maxlength: 10,
     } ,

        password: {
            type: String,
            required: true,
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
const userModel = mongoose.model(
    "nh_user_details",
    userSchema
);

module.exports = userModel;