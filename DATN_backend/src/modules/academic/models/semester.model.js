
const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
    {
        // Mã học kỳ
        semesterCode: {
            type: String,
            required: [true, "Mã học kỳ không được để trống"],
            unique: true,
            trim: true,
            uppercase: true
        },

        // Tên học kỳ
        semesterName: {
            type: String,
            required: [true, "Tên học kỳ không được để trống"],
            trim: true
        },

        // Năm học
        academicYear: {
            type: String,
            required: true,
            trim: true
        },

        // Ngày bắt đầu
        startDate: {
            type: Date,
            required: true
        },

        // Ngày kết thúc
        endDate: {
            type: Date,
            required: true
        },

        // Trạng thái học kỳ
        status: {
            type: String,
            enum: [
                "upcoming",
                "ongoing",
                "completed",
                "cancelled"
            ],
            default: "upcoming"
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Kiểm tra ngày bắt đầu và kết thúc
semesterSchema.pre("validate", function () {
    if (
        this.startDate &&
        this.endDate &&
        this.endDate <= this.startDate
    ) {
        this.invalidate(
            "endDate",
            "Ngày kết thúc phải sau ngày bắt đầu"
        );
    }
});

// Index tìm kiếm học kỳ theo năm học
semesterSchema.index({ academicYear: 1, startDate: 1 });

const Semester = mongoose.model("Semester", semesterSchema);

module.exports = Semester;
