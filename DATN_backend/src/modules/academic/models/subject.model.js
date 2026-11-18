
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        // Mã môn học
        subjectCode: {
            type: String,
            required: [true, "Mã môn học không được để trống"],
            unique: true,
            trim: true,
            uppercase: true
        },

        // Tên môn học
        subjectName: {
            type: String,
            required: [true, "Tên môn học không được để trống"],
            trim: true
        },

        // Số tín chỉ
        credits: {
            type: Number,
            required: true,
            min: [0, "Số tín chỉ không được âm"]
        },

        // Mô tả môn học
        description: {
            type: String,
            trim: true,
            default: ""
        },

        // Có tính vào GPA hay không
        isIncludedInGPA: {
            type: Boolean,
            default: true
        },

        // Trạng thái môn học
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Tạo index tìm kiếm môn học
subjectSchema.index({ subjectName: 1 });

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
