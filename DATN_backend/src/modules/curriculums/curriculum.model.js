const mongoose = require("mongoose");

// Stable programme identity. Cohort-specific rules live in CurriculumVersion.
const curriculumSchema = new mongoose.Schema(
    {
        curriculumCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
        name: { type: String, required: true, trim: true },
        major: { type: mongoose.Schema.Types.ObjectId, ref: "Major", default: null },
        // Maintained for legacy records that identify the major by code.
        majorCode: { type: String, trim: true, uppercase: true, default: null },
        // Legacy programme fields. New records must use CurriculumVersion.
        cohort: { type: String, trim: true, default: null },
        totalCreditsRequired: { type: Number, min: 0, default: null },
        description: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["active", "inactive", "archived"], default: "active" }
    },
    { timestamps: true, versionKey: false }
);

curriculumSchema.index({ major: 1, status: 1 });
curriculumSchema.index({ majorCode: 1, status: 1 });
module.exports = mongoose.model("Curriculum", curriculumSchema);
