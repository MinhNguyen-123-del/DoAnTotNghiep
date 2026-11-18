const mongoose = require("mongoose");

// A subject requirement inside a particular programme version. `curriculum`
// remains denormalised for convenient legacy queries and backward compatibility.
const curriculumSubjectSchema = new mongoose.Schema({
    curriculum: { type: mongoose.Schema.Types.ObjectId, ref: "Curriculum", required: true },
    curriculumVersion: { type: mongoose.Schema.Types.ObjectId, ref: "CurriculumVersion", default: null },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    // Marks special programme requirements without relying on a subject name.
    requirementType: {
        type: String,
        enum: ["normal", "internship", "graduation_project"],
        default: "normal"
    },
    isRequired: { type: Boolean, default: true },
    recommendedSemester: { type: Number, min: 1, default: null },
    group: { type: String, trim: true, default: "general" },
    credits: { type: Number, required: true, min: 0 }
}, { timestamps: true, versionKey: false });

curriculumSubjectSchema.index(
    { curriculum: 1, subject: 1 },
    { unique: true, partialFilterExpression: { curriculumVersion: null } }
);
curriculumSubjectSchema.index(
    { curriculumVersion: 1, subject: 1 },
    { unique: true, partialFilterExpression: { curriculumVersion: { $type: "objectId" } } }
);
curriculumSubjectSchema.index({ curriculumVersion: 1, isRequired: 1 });

module.exports = mongoose.model("CurriculumSubject", curriculumSubjectSchema);
