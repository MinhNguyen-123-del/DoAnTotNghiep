
const { GoogleGenAI } = require("@google/genai");

// Lấy API Key từ biến môi trường
const apiKey = process.env.GEMINI_API_KEY;

// Kiểm tra API Key
if (!apiKey) {
    throw new Error(
        "Thiếu GEMINI_API_KEY trong file .env"
    );
}

// Khởi tạo Gemini Client
const gemini = new GoogleGenAI({
    apiKey
});

// Model sử dụng
const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-flash-latest";

module.exports = {
    gemini,
    GEMINI_MODEL
};
