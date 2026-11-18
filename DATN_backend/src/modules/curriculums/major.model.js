const mongoose = require("mongoose");

const majorSchema = new mongoose.Schema({
    majorCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    degreeName: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true, versionKey: false });

majorSchema.index({ faculty: 1, status: 1 });
module.exports = mongoose.model("Major", majorSchema);
