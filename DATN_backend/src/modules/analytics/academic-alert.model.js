
const mongoose = require("mongoose");

const academicAlertSchema = new mongoose.Schema(
    {
        // Sinh viên nhận cảnh báo
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: true,
            index: true
        },

        // Học kỳ liên quan (nếu có)
        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
            default: null
        },

        // Loại cảnh báo
        type: {
            type: String,
            enum: [
                "low_gpa",
                "failed_subject",
                "insufficient_credits",
                "academic_risk"
            ],
            required: true
        },

        // Mức độ cảnh báo
        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        // Tiêu đề cảnh báo
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Nội dung cảnh báo
        message: {
            type: String,
            required: true,
            trim: true
        },

        // Dữ liệu phân tích
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // Trạng thái cảnh báo
        status: {
            type: String,
            enum: ["active", "resolved", "dismissed"],
            default: "active",
            index: true
        },

        // Thời điểm phát hiện
        detectedAt: {
            type: Date,
            default: Date.now
        },

        // Thời điểm giải quyết
        resolvedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Index tối ưu truy vấn
academicAlertSchema.index({
    student: 1,
    status: 1,
    detectedAt: -1
});

academicAlertSchema.index({
    student: 1,
    type: 1,
    semester: 1
});

// Export Mongoose Model
module.exports = mongoose.model(
    "AcademicAlert",
    academicAlertSchema
);
