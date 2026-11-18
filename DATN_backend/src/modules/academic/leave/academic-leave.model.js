const mongoose = require("mongoose");

const academicLeaveSchema = new mongoose.Schema(
    {
        // Sinh vien bao luu
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: true,
            index: true
        },

        // Ngay bat dau bao luu
        startDate: {
            type: Date,
            required: true
        },

        // Ngay ket thuc bao luu (khong bao gom ngay nay)
        endDate: {
            type: Date,
            required: true
        },

        // Ly do bao luu
        reason: {
            type: String,
            required: true,
            trim: true
        },

        // Trang thai ho so bao luu
        status: {
            type: String,
            enum: ["approved", "cancelled"],
            default: "approved"
        },

        // Nguoi phe duyet
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Ghi chu
        note: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Ngay ket thuc phai sau ngay bat dau
academicLeaveSchema.pre("validate", function () {
    if (
        this.startDate &&
        this.endDate &&
        this.endDate <= this.startDate
    ) {
        this.invalidate(
            "endDate",
            "Ngay ket thuc bao luu phai sau ngay bat dau"
        );
    }
});

// Ho tro truy van lich su bao luu
academicLeaveSchema.index({
    student: 1,
    startDate: 1,
    endDate: 1
});

module.exports = mongoose.model(
    "AcademicLeave",
    academicLeaveSchema
);
