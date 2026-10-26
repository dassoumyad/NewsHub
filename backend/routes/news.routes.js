const express = require("express");
const multer = require("multer");
const { body, query } = require("express-validator");

const require_admin = require("../midleware/requireAdmin");
const verify_token = require("../midleware/verifyToken");

const upload = require("../services/diskStorage");

const {
    create_new_news,
    fetch_all_news,
    fetch_all_paid_news,
    fetch_all_subscriptions,
    edit_existing_news,
    delete_existing_news,
    fetch_public_news
} = require("../controllers/news.controllers");

const router = express.Router();

const handle_image_upload = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                message: err.message,
                success: false,
            });
        } else if (err) {
            return res.status(400).json({
                message: err.message,
                success: false,
            });
        }
        // Multipart clients send dotted form keys; expose nested aliases so
        // express-validator can validate them while controllers keep reading
        // the literal keys expected by existing clients.
        if (req.body["content.headline"] || req.body["content.description"]) {
            req.body.content = {
                headline: req.body["content.headline"],
                description: req.body["content.description"],
            };
        }
        next();
    });
};

router.post(
    "/create-news",
    require_admin,
    handle_image_upload,
    [
        body("title")
            .trim()
            .notEmpty().withMessage("Title is required"),

        body("description")
            .trim()
            .notEmpty().withMessage("Description is required"),

        body("category_name")
            .trim()
            .notEmpty().withMessage("Category name is required"),

        body("author")
            .trim()
            .notEmpty().withMessage("Author is required"),

        body("content.headline")
            .trim()
            .notEmpty().withMessage("Headline is required"),

        body("content.description")
            .trim()
            .notEmpty().withMessage("Content description is required"),

        body("status")
            .optional()
            .isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive"),
    ],
    create_new_news
);

router.get(
    "/fetch-all-news",
    require_admin,
    [
        query("category_name").optional().isString().withMessage("Invalid category name"),
        query("search").optional().isString().withMessage("Invalid search"),
        query("skip").optional().isInt({ min: 0 }).withMessage("Invalid skip value"),
    ],
    fetch_all_news
);

router.get(
    "/fetch-all-paid-news",
    verify_token,
    [
        query("category_name").optional().isString().withMessage("Invalid category name"),
        query("search").optional().isString().withMessage("Invalid search"),
        query("skip").optional().isInt({ min: 0 }).withMessage("Invalid skip value"),
    ],
    fetch_all_paid_news
);

router.get(
    "/fetch-all-subscriptions",
    require_admin,
    fetch_all_subscriptions
);

router.put(
    "/edit-news",
    require_admin,
    handle_image_upload,
    [
        body("_id")
            .notEmpty().withMessage("News id is required")
            .isMongoId().withMessage("Invalid news id"),

        body("title")
            .trim()
            .notEmpty().withMessage("Title is required"),

        body("description")
            .trim()
            .notEmpty().withMessage("Description is required"),

        body("category_name")
            .trim()
            .notEmpty().withMessage("Category name is required"),

        body("author")
            .trim()
            .notEmpty().withMessage("Author is required"),

        body("content.headline")
            .trim()
            .notEmpty().withMessage("Headline is required"),

        body("content.description")
            .trim()
            .notEmpty().withMessage("Content description is required"),

        body("status")
            .optional()
            .isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive"),
    ],
    edit_existing_news
);

router.delete(
    "/delete-news",
    require_admin,
    [
        body("_id")
            .notEmpty().withMessage("News id is required")
            .isMongoId().withMessage("Invalid news id"),
    ],
    delete_existing_news
);

router.get(
    "/public-news",
    [
        query("category_name")
            .optional()
            .isString()
            .withMessage("Invalid category name"),
    ],
    fetch_public_news
);


module.exports = router;
