
const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category_name: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      headline: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // NEW: identifies premium articles
    isPremium: {
      type: Boolean,
      default: false,
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

newsSchema.index({
  title: 1,
  description: 1,
  category_name: 1,
  author: 1,
});

newsSchema.index({
  title: "text",
  description: "text",
  category_name: "text",
  author: "text",
  "content.headline": "text",
  "content.description": "text",
});

const newsModel = mongoose.model(
  "nh_news_details",
  newsSchema
);

module.exports = newsModel;
