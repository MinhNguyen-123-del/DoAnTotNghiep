
const dotenv = require("dotenv");

// Đọc biến môi trường từ file .env
dotenv.config();

// Kiểm tra các biến môi trường bắt buộc
const requiredEnv = [
    "MONGODB_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "GEMINI_API_KEY"
];

const missingEnv = requiredEnv.filter(
    (key) => !process.env[key]
);

if (missingEnv.length > 0) {
    throw new Error(
        `Missing environment variables: ${missingEnv.join(", ")}`
    );
}

// Cấu hình môi trường toàn hệ thống
const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",

    PORT: Number(process.env.PORT) || 5000,

    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

    MONGODB_URI: process.env.MONGODB_URI,

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,

    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

    JWT_ACCESS_EXPIRES_IN:
        process.env.JWT_ACCESS_EXPIRES_IN || "15m",

    JWT_REFRESH_EXPIRES_IN:
        process.env.JWT_REFRESH_EXPIRES_IN || "7d",

    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash"
};

module.exports = ENV;
