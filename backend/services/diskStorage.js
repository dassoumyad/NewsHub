const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4 } = require("uuid");

const upload_path = path.join(process.cwd(), "statics", "uploads");

if (!fs.existsSync(upload_path)) {
    fs.mkdirSync(upload_path, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, upload_path);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const file_name = `${Date.now()}-${v4()}${ext}`;
        cb(null, file_name);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes.includes(ext)) {
        return cb(new Error("Only image files are allowed (jpg, jpeg, png, webp)"));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;