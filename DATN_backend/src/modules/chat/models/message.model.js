
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        // Hội thoại chứa tin nhắn
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },

        // Sinh viên sở hữu tin nhắn
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: true
        },

        // Người gửi tin nhắn
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        // Nội dung tin nhắn
        content: {
            type: String,
            required: true,
            trim: true
        },

        // Nguồn tài liệu được AI sử dụng
        sources: [
            {
                documentId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "KnowledgeDocument",
                    default: null
                },

                chunkId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "KnowledgeChunk",
                    default: null
                },

                title: {
                    type: String,
                    trim: true,
                    default: ""
                },

                page: {
                    type: Number,
                    default: null
                },

                excerpt: {
                    type: String,
                    default: ""
                }
            }
        ],

        // Thông tin bổ sung của AI
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Lấy lịch sử tin nhắn theo hội thoại
messageSchema.index({
    conversation: 1,
    createdAt: 1
});

// Tìm tin nhắn theo sinh viên
messageSchema.index({
    student: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Message",
    messageSchema
);
