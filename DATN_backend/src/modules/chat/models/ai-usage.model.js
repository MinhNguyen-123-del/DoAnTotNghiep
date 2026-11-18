
const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema(
    {
        // Sinh viên sử dụng AI
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: true
        },

        // Hội thoại liên quan
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            default: null
        },

        // Tin nhắn được tạo ra
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        // Nhà cung cấp AI
        provider: {
            type: String,
            default: "google"
        },

        // Tên model Gemini
        model: {
            type: String,
            required: true
        },

        // Số token đầu vào
        promptTokens: {
            type: Number,
            default: 0,
            min: 0
        },

        // Số token đầu ra
        completionTokens: {
            type: Number,
            default: 0,
            min: 0
        },

        // Tổng số token
        totalTokens: {
            type: Number,
            default: 0,
            min: 0
        },

        // Chi phí ước tính (USD)
        estimatedCost: {
            type: Number,
            default: 0,
            min: 0
        },

        // Trạng thái gọi AI
        status: {
            type: String,
            enum: ["success", "failed"],
            default: "success"
        },

        // Nội dung lỗi nếu gọi AI thất bại
        errorMessage: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Thống kê lượt sử dụng AI của sinh viên
aiUsageSchema.index({
    student: 1,
    createdAt: -1
});

// Thống kê theo model AI
aiUsageSchema.index({
    model: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "AIUsage",
    aiUsageSchema
);
