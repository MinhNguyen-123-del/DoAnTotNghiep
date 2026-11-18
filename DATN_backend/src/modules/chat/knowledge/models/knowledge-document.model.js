
const mongoose = require("mongoose");

const knowledgeDocumentSchema = new mongoose.Schema(
    {
        // Tên tài liệu
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Mô tả tài liệu
        description: {
            type: String,
            default: ""
        },

        // Tên file gốc
        fileName: {
            type: String,
            required: true,
            trim: true
        },

        // Loại tài liệu: PDF, DOCX, TXT...
        fileType: {
            type: String,
            required: true,
            enum: ["pdf", "docx", "txt"]
        },

        // Đường dẫn lưu file
        filePath: {
            type: String,
            default: ""
        },

        // Danh mục tài liệu
        category: {
            type: String,
            required: true,
            enum: [
                "academic_regulations",
                "training_program",
                "graduation_requirements",
                "student_handbook",
                "study_guidance",
                "other"
            ],
            default: "other"
        },

        // Phạm vi áp dụng
        scope: {
            type: String,
            enum: ["public", "internal"],
            default: "public"
        },

        // Năm áp dụng tài liệu
        academicYear: {
            type: String,
            default: ""
        },

        // Phiên bản tài liệu
        version: {
            type: String,
            default: "1.0"
        },

        // Trạng thái xử lý
        processingStatus: {
            type: String,
            enum: [
                "pending",
                "processing",
                "completed",
                "failed"
            ],
            default: "pending"
        },

        // Trạng thái sử dụng
        status: {
            type: String,
            enum: ["active", "inactive", "archived"],
            default: "active"
        },

        // Người tạo tài liệu
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Thời điểm xử lý hoàn tất
        processedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Index hỗ trợ tìm kiếm tài liệu
knowledgeDocumentSchema.index({
    category: 1,
    status: 1
});

knowledgeDocumentSchema.index({
    processingStatus: 1
});

module.exports = mongoose.model(
    "KnowledgeDocument",
    knowledgeDocumentSchema
);
