const express = require("express");
const { body } = require("express-validator");
const require_admin = require("../midleware/requireAdmin");
const {
    create_new_category,
    fetch_category,
    edit_category,
    delete_category,
} = require("../controllers/category.controllers");

const router = express.Router();

router.post(
    "/create-category",
    require_admin,
    [
        body("name")
            .trim()
            .notEmpty().withMessage("Category name is required"),
    ],
    create_new_category
);

router.get("/fetch-all-category", fetch_category);

router.put(
    "/edit-category",
    require_admin,
    [
        body("name")
            .trim()
            .notEmpty().withMessage("Category name is required"),

        body("_id")
            .isMongoId().withMessage("Invalid category id"),
    ],
    edit_category
);

router.delete(
    "/delete-category",
    require_admin,
    [
        body("_id")
            .isMongoId().withMessage("Invalid category id"),
    ],
    delete_category
);

module.exports = router;
