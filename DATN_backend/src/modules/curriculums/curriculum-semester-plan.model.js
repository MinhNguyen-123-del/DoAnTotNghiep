const mongoose = require("mongoose");

// =====================================================
// KE HOACH TIN CHI THEO HOC KY CUA PHIEN BAN CTDT
// =====================================================

const curriculumSemesterPlanSchema = new mongoose.Schema(
    {
        // Phien ban chuong trinh dao tao ap dung ke hoach
        curriculumVersion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CurriculumVersion",
            required: true
        },

        // Hoc ky thu 1, 2, 3...
        semesterNumber: {
            type: Number,
            required: true,
            min: 1
        },

        // So tin chi admin yeu cau trong hoc ky nay
        expectedCredits: {
            type: Number,
            required: true,
            min: 0
        },

        // Ghi chu cua admin
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

// Moi phien ban CTDT chi co mot ke hoach cho mot hoc ky.
curriculumSemesterPlanSchema.index(
    {
        curriculumVersion: 1,
        semesterNumber: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "CurriculumSemesterPlan",
    curriculumSemesterPlanSchema
);
