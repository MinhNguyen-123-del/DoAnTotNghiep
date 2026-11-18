
const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
    {
        // Liên kết tài khoản đăng nhập
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        // Thông tin cá nhân
        studentCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        dateOfBirth: {
            type: Date,
            default: null
        },

        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: "other"
        },

        phone: {
            type: String,
            trim: true,
            default: null
        },

        avatar: {
            type: String,
            default: null
        },

        address: {
            type: String,
            default: null
        },

        // Thông tin đào tạo
        faculty: {
            code: String,
            name: String
        },

        major: {
            code: String,
            name: String
        },

        cohort: {
            type: String,
            required: true
        },

        admissionYear: {
            type: Number,
            required: true
        },

        curriculum: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Curriculum",
            default: null
        },

        // Phiên bản chính thức áp dụng cho sinh viên (ví dụ CNTT-K20).
        // `curriculum` is retained for existing records during migration.
        curriculumVersion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CurriculumVersion",
            default: null
        },

        // Trạng thái học tập
        academicStatus: {
            type: String,
            enum: [
                "studying",
                "reserved",
                "graduated",
                "suspended",
                "withdrawn"
            ],
            default: "studying"
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const StudentProfile = mongoose.model(
    "StudentProfile",
    studentProfileSchema
);

module.exports = StudentProfile;
