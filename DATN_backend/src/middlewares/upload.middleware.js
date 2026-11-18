
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Thư mục lưu tài liệu
const uploadDir = path.join(
    __dirname,
    "../uploads/knowledge"
);

// Tự động tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Các định dạng tài liệu được hỗ trợ
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
];

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

        cb(null, fileName);
    }
});

// Kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);
    const isValidMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (!isValidExtension || !isValidMimeType) {
        return cb(
            new Error("Chỉ chấp nhận tài liệu PDF, DOCX và TXT.")
        );
    }

    cb(null, true);
};

// Khởi tạo Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // Tối đa 20MB
        files: 1
    }
});

// Middleware upload một tài liệu
const uploadKnowledgeFile = upload.single("file");

module.exports = {
    uploadKnowledgeFile
};
