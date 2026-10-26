const express = require("express");
const upload = require("../services/diskStorage");
const { upload_image } = require("../controllers/upload.controllers");

const router = express.Router();

router.post("/upload-image", upload.single("image"), upload_image);

module.exports = router;