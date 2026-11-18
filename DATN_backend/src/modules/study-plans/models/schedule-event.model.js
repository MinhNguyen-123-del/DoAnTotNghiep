
const mongoose = require("mongoose");

// =====================================================
// SCHEMA LỊCH HỌC VÀ LỊCH THI
// =====================================================

const scheduleEventSchema = new mongoose.Schema(
    {
        // Sinh viên sở hữu sự kiện
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: [true, "Sinh viên không được để trống"]
        },

        // Kế hoạch học tập liên quan đến sự kiện
        studyPlan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyPlan",
            required: [true, "Kế hoạch học tập không được để trống"]
        },

        // Môn học dự kiến liên quan
        // Có thể để null nếu là sự kiện chung
        plannedCourse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlannedCourse",
            default: null
        },

        // Tên sự kiện
        title: {
            type: String,
            required: [true, "Tên sự kiện không được để trống"],
            trim: true,
            maxlength: [
                200,
                "Tên sự kiện không được vượt quá 200 ký tự"
            ]
        },

        // Loại sự kiện: lịch học, lịch thi hoặc sự kiện khác
        eventType: {
            type: String,
            enum: {
                values: ["class", "exam", "other"],
                message: "Loại sự kiện không hợp lệ"
            },
            required: [true, "Loại sự kiện không được để trống"]
        },

        // Thời gian bắt đầu
        startTime: {
            type: Date,
            required: [true, "Thời gian bắt đầu không được để trống"]
        },

        // Thời gian kết thúc
        endTime: {
            type: Date,
            required: [true, "Thời gian kết thúc không được để trống"]
        },

        // Địa điểm học hoặc thi
        location: {
            type: String,
            trim: true,
            default: "",
            maxlength: [
                255,
                "Địa điểm không được vượt quá 255 ký tự"
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
        },

        // Trạng thái sự kiện
        status: {
            type: String,
            enum: {
                values: [
                    "scheduled",
                    "completed",
                    "cancelled"
                ],
                message: "Trạng thái sự kiện không hợp lệ"
            },
            default: "scheduled"
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

// Kiểm tra thời gian bắt đầu và kết thúc
scheduleEventSchema.pre("validate", function () {
    if (
        this.startTime &&
        this.endTime &&
        this.endTime <= this.startTime
    ) {
        this.invalidate(
            "endTime",
            "Thời gian kết thúc phải sau thời gian bắt đầu"
        );
    }

    // Lịch học và lịch thi phải liên kết với môn học dự kiến
    if (
        ["class", "exam"].includes(this.eventType) &&
        !this.plannedCourse
    ) {
        this.invalidate(
            "plannedCourse",
            "Lịch học và lịch thi phải có môn học liên quan"
        );
    }
});

// =====================================================
// INDEX
// =====================================================

// Tìm lịch theo sinh viên và thời gian bắt đầu
scheduleEventSchema.index({
    student: 1,
    startTime: 1
});

// Tìm lịch theo kế hoạch và loại sự kiện
scheduleEventSchema.index({
    studyPlan: 1,
    eventType: 1
});

// Tìm lịch theo trạng thái
scheduleEventSchema.index({
    student: 1,
    status: 1
});

// =====================================================
// EXPORT MODEL
// =====================================================

const ScheduleEvent = mongoose.model(
    "ScheduleEvent",
    scheduleEventSchema
);

module.exports = ScheduleEvent;
