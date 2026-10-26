require("dotenv").config();
const mongoose = require("mongoose");
const NewsModel = require("../Models/news.model");
const CategoryModel = require("../Models/category.model");
const stories = require("./premium-stories");

async function seedPremiumNews() {
  for (const story of stories) {
    await CategoryModel.updateOne({ name: story.category_name }, { $setOnInsert: { name: story.category_name } }, { upsert: true });
    const existing = await NewsModel.findOne({ title: story.title }).select("_id").lean();
    if (existing) {
      console.log(`Kept existing premium story: ${story.title}`);
      continue;
    }
    await NewsModel.create(story);
    console.log(`Added premium story: ${story.title}`);
  }
}

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(seedPremiumNews)
    .catch((error) => {
      console.error("Premium story seeding failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState) await mongoose.disconnect();
    });
}

module.exports = seedPremiumNews;
