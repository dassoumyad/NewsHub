const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const NewsModel = require("../Models/news.model");
const CategoryModel = require("../Models/category.model");
const AdminModel = require("../Models/admin.model");
const SubscriptionModel = require("../Models/subscription.model");
const UserModel = require("../Models/user.model");

// deletes an uploaded file from disk if something fails after upload
const delete_uploaded_file = (file) => {
    if (!file) return;
    const filePath = path.join(process.cwd(), "statics", "uploads", file.filename);
    fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete orphaned file:", err);
    });
};

// create a new news post
const create_new_news = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "News image is required",
                success: false,
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            delete_uploaded_file(req.file);
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const admin = await AdminModel.findOne({ email: req.token.email });
        if (!admin) {
            delete_uploaded_file(req.file);
            return res.status(401).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const category = await CategoryModel.findOne({ name: req.body.category_name });
        if (!category) {
            delete_uploaded_file(req.file);
            return res.status(400).json({
                message: "Category does not exist",
                success: false,
            });
        }

        await NewsModel.create({
            title: req.body.title,
            image: req.file.filename,
            description: req.body.description,
            category_name: req.body.category_name,
            author: req.body.author,
            content: {
                headline: req.body["content.headline"],
                description: req.body["content.description"],
            },
            isPremium: req.body.isPremium === "true" || req.body.isPremium === true,
            status: req.body.status,
        });

        return res.status(200).json({
            message: "News Created Successfully",
            success: true,
        });
    } catch (error) {
        delete_uploaded_file(req.file);
        console.error("Create News Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// get all free news, with optional category filter, search, and pagination
const fetch_all_news = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const admin = await AdminModel.findOne({ email: req.token.email });
        if (!admin) {
            return res.status(401).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const { category_name, search } = req.query;
        const skip = parseInt(req.query.skip) || 0;

        const query = {};
        if (category_name) {
            query.category_name = category_name;
        }
        if (search) {
            query.$text = { $search: search };
        }

        const data = await NewsModel.find(query).sort({ _id: -1 }).skip(skip).limit(50);

        return res.status(200).json({
            message: "News Fetched Successfully",
            success: true,
            data,
        });
    } catch (error) {
        console.error("Fetch News Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// get paid news - only if the logged-in user has an active subscription
const fetch_all_paid_news = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const exist_user = await UserModel.findOne({ email: req.token.email });
        if (!exist_user) {
            return res.status(401).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const exist_subscription = await SubscriptionModel.findOne({ user_id: exist_user._id });

        // block if they never subscribed, or their subscription has expired
        if (!exist_subscription || exist_subscription.subscription_end_date < new Date()) {
            return res.status(403).json({
                message: "You need an active subscription to view this content",
                success: false,
            });
        }

        const { category_name, search } = req.query;
        const skip = parseInt(req.query.skip) || 0;

        const query = {
            status: { $ne: "Inactive" },
            isPremium: true,
        };
        if (category_name) {
            query.category_name = category_name;
        }
        if (search) {
            query.$text = { $search: search };
        }

        const data = await NewsModel.find(query).sort({ _id: -1 }).skip(skip).limit(50);

        return res.status(200).json({
            message: "News Fetched Successfully",
            success: true,
            data,
        });
    } catch (error) {
        console.error("Fetch Paid News Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// admin-only - see every user's subscription status
const fetch_all_subscriptions = async (req, res) => {
    try {
        const admin = await AdminModel.findOne({ email: req.token.email });
        if (!admin) {
            return res.status(401).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const subscriptions = await SubscriptionModel.find({})
            .populate("user_id", "name email mobile_no")
            .sort({ createdAt: -1 });

        // add a simple true/false flag so the admin panel doesn't have to calculate dates itself
        const data = subscriptions.map((sub) => ({
            user: sub.user_id,
            amount: sub.amount,
            subscription_start_date: sub.subscription_start_date,
            subscription_end_date: sub.subscription_end_date,
            is_active: sub.subscription_end_date > new Date(),
        }));

        return res.status(200).json({
            message: "Subscriptions fetched successfully",
            success: true,
            data,
        });
    } catch (error) {
        console.error("Fetch Subscriptions Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// update an existing news post
const edit_existing_news = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            delete_uploaded_file(req.file);
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const admin = await AdminModel.findOne({ email: req.token.email });
        if (!admin) {
            delete_uploaded_file(req.file);
            return res.status(401).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const news = await NewsModel.findOne({ _id: req.body._id });
        if (!news) {
            delete_uploaded_file(req.file);
            return res.status(400).json({
                message: "News does not exist",
                success: false,
            });
        }

        const category = await CategoryModel.findOne({ name: req.body.category_name });
        if (!category) {
            delete_uploaded_file(req.file);
            return res.status(400).json({
                message: "Category does not exist",
                success: false,
            });
        }

        const old_image = news.image;

        news.title = req.body.title;
        news.description = req.body.description;
        news.category_name = req.body.category_name;
        news.author = req.body.author;
        news.content.headline = req.body["content.headline"];
        news.content.description = req.body["content.description"];
        if (req.body.isPremium !== undefined) {
            news.isPremium = req.body.isPremium === "true" || req.body.isPremium === true;
        }

        if (req.file) {
            news.image = req.file.filename;
        }

        if (req.body.status) {
            news.status = req.body.status;
        }

        await news.save();

        if (req.file && old_image) {
            const oldPath = path.join(process.cwd(), "statics", "uploads", old_image);
            fs.unlink(oldPath, (err) => {
                if (err) console.error("Failed to delete old image:", err);
            });
        }

        return res.status(200).json({
            message: "News Updated Successfully",
            success: true,
        });
    } catch (error) {
        delete_uploaded_file(req.file);
        console.error("Edit News Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// delete a news post
const delete_existing_news = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const admin = await AdminModel.findOne({ email: req.token.email });
        if (!admin) {
            return res.status(401).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const news = await NewsModel.findOne({ _id: req.body._id });
        if (!news) {
            return res.status(400).json({
                message: "News does not exist",
                success: false,
            });
        }

        await NewsModel.deleteOne({ _id: req.body._id });

        if (news.image) {
            const imagePath = path.join(process.cwd(), "statics", "uploads", news.image);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Failed to delete news image:", err);
            });
        }

        return res.status(200).json({
            message: "News Deleted Successfully",
            success: true,
        });
    } catch (error) {
        console.error("Delete News Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

const fetch_public_news = async (req, res) => {
    try {
        const { category_name } = req.query;
        // Keep premium stories out of the public feed. Subscribed users receive
        // them through /fetch-all-paid-news after the subscription check.
        // Older documents may not have the newer fields. Treat a missing
        // status as active and a missing isPremium flag as free.
        const query = {
            status: { $ne: "Inactive" },
            isPremium: { $ne: true },
        };

        if (category_name) {
            query.category_name = category_name;
        }

        const data = await NewsModel.find(query)
            .select("title image description category_name author content createdAt")
            .sort({ _id: -1 })
            .limit(50)
            .lean();

        return res.status(200).json({
            message: "News fetched successfully",
            success: true,
            data,
        });
    } catch (error) {
        console.error("Fetch Public News Error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};


module.exports = {
    create_new_news,
    fetch_all_news,
    fetch_all_paid_news,
    fetch_all_subscriptions,
    edit_existing_news,
    delete_existing_news,
    fetch_public_news
};
