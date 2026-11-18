
const mongoose = require("mongoose");

// =====================================================
// SCHEMA KẾ HOẠCH HỌC TẬP
// =====================================================

const studyPlanSchema = new mongoose.Schema(
    {
        // Sinh viên sở hữu kế hoạch học tập
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: [true, "Sinh viên không được để trống"]
        },

        // Học kỳ mà sinh viên muốn lập kế hoạch
        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
            required: [true, "Học kỳ không được để trống"]
        },

        // Tên kế hoạch học tập
        planName: {
            type: String,
            required: [true, "Tên kế hoạch không được để trống"],
            trim: true,
            maxlength: [
                150,
                "Tên kế hoạch không được vượt quá 150 ký tự"
            ]
        },

        // Mô tả mục tiêu và nội dung kế hoạch
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: [
                1000,
                "Mô tả không được vượt quá 1000 ký tự"
            ]
        },

        // Trạng thái kế hoạch học tập
        status: {
            type: String,
            enum: {
                values: [
                    "draft",
                    "active",
                    "completed",
                    "cancelled"
                ],
                message: "Trạng thái kế hoạch không hợp lệ"
            },
            default: "draft"
        },

        // Tổng tín chỉ của các môn học đã thêm vào kế hoạch
        // Giá trị này do Backend tự động tính toán và cập nhật
        totalPlannedCredits: {
            type: Number,
            default: 0,
            min: [
                0,
                "Tổng tín chỉ không được nhỏ hơn 0"
            ],
            validate: {
                validator: Number.isFinite,
                message: "Tổng tín chỉ phải là một số hợp lệ"
            }
        }
    },
    {
        // Tự động tạo createdAt và updatedAt
        timestamps: true,

        // Không sử dụng trường __v
        versionKey: false
    }
);

// =====================================================
// INDEX
// =====================================================

// Mỗi sinh viên chỉ có một kế hoạch cho một học kỳ
studyPlanSchema.index(
    {
        student: 1,
        semester: 1
    },
    {
        unique: true
    }
);

// Hỗ trợ tìm kế hoạch theo sinh viên và trạng thái
studyPlanSchema.index({
    student: 1,
    status: 1
});

// =====================================================
// EXPORT MODEL
// =====================================================

const StudyPlan = mongoose.model(
    "StudyPlan",
    studyPlanSchema
);

module.exports = StudyPlan;
