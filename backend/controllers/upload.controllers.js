const upload_image = (req, res) => {
    try {
        // if no file arrived, something went wrong
        if (!req.file) {
            return res.status(400).json({
                message: "No file was uploaded",
                success: false,
            });
        }

        // file uploaded successfully
        return res.status(200).json({
            message: "File uploaded successfully",
            success: true,
            file_name: req.file.filename,
            file_path: req.file.path,
        });
    } catch (error) {
        console.error("Upload Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

module.exports = { upload_image };