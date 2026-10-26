const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true,
    }
);

// Model
const categoryModel = mongoose.model(
    "nh_category_details",
    categorySchema
);

module.exports = categoryModel;