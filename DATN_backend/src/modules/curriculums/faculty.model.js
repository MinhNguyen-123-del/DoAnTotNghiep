const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
    facultyCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Faculty", facultySchema);
