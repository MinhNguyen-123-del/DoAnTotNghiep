
const mongoose = require("mongoose");

// Schema lưu trữ kết quả học tập của sinh viên
const academicRecordSchema = new mongoose.Schema(
    {
        // Sinh viên sở hữu kết quả học tập
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: true
        },

        // Môn học mà sinh viên đã đăng ký hoặc đã học
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },

        // Học kỳ sinh viên thực hiện môn học
        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
            required: true
        },

        // Số lần sinh viên đã học môn này
        // Ví dụ: lần 1, lần 2 (học lại), lần 3
        attemptNumber: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },

        // Điểm tổng kết theo thang điểm 10
        finalScore10: {
            type: Number,
            min: 0,
            max: 10,
            default: null
        },

        // Điểm quy đổi theo thang điểm 4
        gradePoint4: {
            type: Number,
            min: 0,
            max: 4,
            default: null
        },

        // Số tín chỉ tại thời điểm ghi nhận kết quả
        // Giúp bảo toàn dữ liệu khi số tín chỉ môn học thay đổi
        creditsSnapshot: {
            type: Number,
            required: true,
            min: 0
        },

        // Xác định môn học có được tính vào GPA hay không
        includedInGPA: {
            type: Boolean,
            default: true
        },

        // Trạng thái xử lý kết quả học tập
        status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "rejected",
                "cancelled"
            ],
            default: "pending"
        },

        // Thời điểm kết quả được xác nhận chính thức
        confirmedAt: {
            type: Date,
            default: null
        },

        // Trạng thái đạt hoặc trượt môn học
        // null: Chưa có kết quả xác nhận
        // true: Đạt môn
        // false: Trượt môn
        isPassed: {
            type: Boolean,
            default: null
        }
    },
    {
        // Tự động tạo createdAt và updatedAt
        timestamps: true,

        // Không tạo trường __v
        versionKey: false
    }
);

// Không cho phép trùng lần học của cùng sinh viên và môn học
academicRecordSchema.index(
    {
        student: 1,
        subject: 1,
        attemptNumber: 1
    },
    {
        unique: true
    }
);

// Tối ưu truy vấn kết quả học tập theo sinh viên và học kỳ
academicRecordSchema.index({
    student: 1,
    semester: 1
});

// Tối ưu truy vấn lịch sử học lại theo sinh viên và môn học
academicRecordSchema.index({
    student: 1,
    subject: 1,
    status: 1
});

// Kiểm tra dữ liệu trước khi lưu kết quả học tập
academicRecordSchema.pre("validate", function () {

    // Chỉ kiểm tra các điều kiện bắt buộc khi kết quả đã xác nhận
    if (this.status === "confirmed") {

        // Kiểm tra điểm hệ 10
        if (
            this.finalScore10 === null ||
            this.finalScore10 === undefined
        ) {
            this.invalidate(
                "finalScore10",
                "Kết quả xác nhận phải có điểm hệ 10"
            );
        }

        // Kiểm tra điểm hệ 4
        if (
            this.gradePoint4 === null ||
            this.gradePoint4 === undefined
        ) {
            this.invalidate(
                "gradePoint4",
                "Kết quả xác nhận phải có điểm hệ 4"
            );
        }

        // Kiểm tra trạng thái đạt hoặc trượt
        if (
            this.isPassed === null ||
            this.isPassed === undefined
        ) {
            this.invalidate(
                "isPassed",
                "Kết quả xác nhận phải xác định trạng thái đạt hoặc trượt"
            );
        }

        // Ghi nhận thời điểm xác nhận nếu chưa có
        if (!this.confirmedAt) {
            this.confirmedAt = new Date();
        }
    }
});

// Tạo Model AcademicRecord từ Schema
const AcademicRecord = mongoose.model(
    "AcademicRecord",
    academicRecordSchema
);

// Xuất Model để sử dụng trong Service và Controller
module.exports = AcademicRecord;
