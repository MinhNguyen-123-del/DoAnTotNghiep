const mongoose = require("mongoose");

const curriculumVersionSchema = new mongoose.Schema({
    curriculum: { type: mongoose.Schema.Types.ObjectId, ref: "Curriculum", required: true },
    versionCode: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    cohort: { type: String, required: true, trim: true },
    effectiveFrom: { type: Date, default: null },
    totalCreditsRequired: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["draft", "active", "retired", "archived"], default: "draft" },
    note: { type: String, trim: true, default: "" }
}, { timestamps: true, versionKey: false });

curriculumVersionSchema.index({ curriculum: 1, versionCode: 1 }, { unique: true });
curriculumVersionSchema.index({ curriculum: 1, cohort: 1 }, { unique: true });
curriculumVersionSchema.index({ cohort: 1, status: 1 });
module.exports = mongoose.model("CurriculumVersion", curriculumVersionSchema);
