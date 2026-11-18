const mongoose = require("mongoose");

const prerequisiteSchema = new mongoose.Schema({
    curriculumVersion: { type: mongoose.Schema.Types.ObjectId, ref: "CurriculumVersion", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    prerequisiteSubject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    type: { type: String, enum: ["prerequisite", "corequisite"], default: "prerequisite" }
}, { timestamps: true, versionKey: false });

prerequisiteSchema.index({ curriculumVersion: 1, subject: 1, prerequisiteSubject: 1, type: 1 }, { unique: true });
prerequisiteSchema.pre("validate", function () {
    if (this.subject && this.prerequisiteSubject && this.subject.toString() === this.prerequisiteSubject.toString()) {
        this.invalidate("prerequisiteSubject", "Môn học không thể là điều kiện của chính nó");
    }
});
module.exports = mongoose.model("Prerequisite", prerequisiteSchema);
