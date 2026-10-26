const { validationResult } = require("express-validator");
const CategoryModel = require("../Models/category.model");
const AdminModel = require("../Models/admin.model");

// create a new category
const create_new_category = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const exist_email = await AdminModel.findOne({ email: req.token.email });
        if (!exist_email) {
            return res.status(400).json({
                message: "Invalid Authentication",
                success: false,
            });
        }
        const exist_mobile = await AdminModel.findOne({ mobile_no: req.token.mobile_no });
        if (!exist_mobile) {
            return res.status(400).json({
                message: "Invalid Authentication",
                success: false,
            });
        }
         await CategoryModel.create({ name: req.body.name });

        return res.status(200).json({
            message: "Category Created Successfully",
            success: true,
        });
    } catch (error) {
        console.error("Create Category Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// get all categories, newest first
const fetch_category = async (req, res) => {
    try {
        const data = await CategoryModel.find({}, { createdAt: 0, updatedAt: 0 }).sort({ _id: -1 });

        return res.status(200).json({
            message: "Category Fetched Successfully",
            data,
            success: true,
        });
    } catch (error) {
        console.error("Fetch Category Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// update a category's name
const edit_category = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const exist_email = await AdminModel.findOne({ email: req.token.email });
        if (!exist_email) {
            return res.status(400).json({
                message: "Invalid Authentication",
                success: false,
            });
        }
        const exist_mobile = await AdminModel.findOne({ mobile_no: req.token.mobile_no });
        if (!exist_mobile) {
            return res.status(400).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const category = await CategoryModel.findOne({ _id: req.body._id });
        if (!category) {
            return res.status(400).json({
                message: "Category does not exist",
                success: false,
            });
        }

        category.name = req.body.name;
        await category.save();

        return res.status(200).json({
            message: "Category Updated Successfully",
            success: true,
        });
    } catch (error) {
        console.error("Edit Category Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

// delete a category
const delete_category = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array(),
                success: false,
            });
        }

        const exist_email = await AdminModel.findOne({ email: req.token.email });
        if (!exist_email) {
            return res.status(400).json({
                message: "Invalid Authentication",
                success: false,
            });
        }
        const exist_mobile = await AdminModel.findOne({ mobile_no: req.token.mobile_no });
        if (!exist_mobile) {
            return res.status(400).json({
                message: "Invalid Authentication",
                success: false,
            });
        }

        const category = await CategoryModel.findOne({ _id: req.body._id });
        if (!category) {
            return res.status(400).json({
                message: "Category does not exist",
                success: false,
            });
        }

        await CategoryModel.deleteOne({ _id: req.body._id });

        return res.status(200).json({
            message: "Category Deleted Successfully",
            success: true,
        });
    } catch (error) {
        console.error("Delete Category Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

module.exports = {
    create_new_category,
    fetch_category,
    edit_category,
    delete_category,
};
