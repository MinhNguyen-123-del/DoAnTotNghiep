
const mongoose = require("mongoose");

// =====================================================
// SCHEMA MÔN HỌC DỰ KIẾN
// =====================================================

const plannedCourseSchema = new mongoose.Schema(
    {
        // Kế hoạch học tập chứa môn học dự kiến
        studyPlan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyPlan",
            required: [true, "Kế hoạch học tập không được để trống"]
        },

        // Môn học sinh viên muốn đăng ký
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: [true, "Môn học không được để trống"]
        },

        // Số tín chỉ tại thời điểm thêm vào kế hoạch
        // Backend tự động lấy từ Subject hoặc CurriculumSubject
        creditsSnapshot: {
            type: Number,
            required: [true, "Số tín chỉ không được để trống"],
            min: [0, "Số tín chỉ không được nhỏ hơn 0"]
        },

        // Trạng thái môn học dự kiến
        status: {
            type: String,
            enum: {
                values: [
                    "planned",
                    "approved",
                    "rejected",
                    "cancelled"
                ],
                message: "Trạng thái môn học không hợp lệ"
            },
            default: "planned"
        },

        // Lý do từ chối môn học
        rejectionReason: {
            type: String,
            trim: true,
            default: "",
            maxlength: [
                500,
                "Lý do từ chối không được vượt quá 500 ký tự"
            ]
        },

        // Ghi chú bổ sung
        note: {
            type: String,
            trim: true,
            default: "",
            maxlength: [
                1000,
                "Ghi chú không được vượt quá 1000 ký tự"
            ]
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
// VALIDATION
// =====================================================

plannedCourseSchema.pre("validate", function () {
    // Nếu môn học bị từ chối thì phải có lý do
    if (this.status === "rejected" && !this.rejectionReason) {
        this.invalidate(
            "rejectionReason",
            "Vui lòng cung cấp lý do từ chối môn học"
        );
    }

    // Các trạng thái khác không cần lưu lý do từ chối
    if (this.status !== "rejected") {
        this.rejectionReason = "";
    }
});

// =====================================================
// INDEX
// =====================================================

// Một môn học chỉ xuất hiện một lần trong cùng kế hoạch
plannedCourseSchema.index(
    {
        studyPlan: 1,
        subject: 1
    },
    {
        unique: true
    }
);

// Hỗ trợ tìm môn học theo kế hoạch và trạng thái
plannedCourseSchema.index({
    studyPlan: 1,
    status: 1
});

// Hỗ trợ tìm kế hoạch có chứa môn học
plannedCourseSchema.index({
    subject: 1
});

// =====================================================
// EXPORT MODEL
// =====================================================

const PlannedCourse = mongoose.model(
    "PlannedCourse",
    plannedCourseSchema
);

module.exports = PlannedCourse;
