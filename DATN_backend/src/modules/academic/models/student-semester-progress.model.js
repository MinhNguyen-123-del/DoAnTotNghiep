const mongoose = require("mongoose");

const studentSemesterProgressSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentProfile",
            required: true
        },

        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
            required: true
        },

        semesterNumber: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: [
                "planned",
                "studying",
                "completed",
                "paused"
            ],
            default: "planned"
        },

        completedAt: {
            type: Date,
            default: null
        },

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

// Moi sinh vien chi co mot ban ghi cho mot hoc ky thuc te.
studentSemesterProgressSchema.index(
    { student: 1, semester: 1 },
    { unique: true }
);

// Moi sinh vien chi co mot ban ghi cho mot hoc ky trong CTDT.
studentSemesterProgressSchema.index(
    { student: 1, semesterNumber: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "StudentSemesterProgress",
    studentSemesterProgressSchema
);
