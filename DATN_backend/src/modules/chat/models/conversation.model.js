
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        // Sinh viên sở hữu cuộc hội thoại
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: true,
            index: true
        },

        // Tiêu đề cuộc hội thoại
        title: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "Cuộc hội thoại mới"
        },

        // Trạng thái cuộc hội thoại
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active"
        },

        // Thời điểm có tin nhắn gần nhất
        lastMessageAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Tìm danh sách hội thoại của sinh viên
conversationSchema.index({
    student: 1,
    lastMessageAt: -1
});

module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);
