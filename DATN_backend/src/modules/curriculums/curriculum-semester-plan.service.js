const mongoose = require("mongoose");

const CurriculumVersion = require("./curriculum-version.model");
const CurriculumSemesterPlan = require(
    "./curriculum-semester-plan.model"
);

// =====================================================
// 1. HAM HO TRO
// =====================================================

const createError = (message, statusCode = 400) => {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};

const validateObjectId = (id, fieldName = "ID") => {
    if (!mongoose.isValidObjectId(id)) {
        throw createError(`${fieldName} khong hop le`);
    }
};

const validatePositiveInteger = (value, fieldName) => {
    if (!Number.isInteger(value) || value < 1) {
        throw createError(`${fieldName} phai la so nguyen duong`);
    }
};

const validateCredits = (value) => {
    if (!Number.isFinite(value) || value < 0) {
        throw createError("So tin chi du kien phai la so khong am");
    }
};

const getCurriculumVersionOrThrow = async (versionId) => {
    validateObjectId(versionId, "Curriculum Version ID");

    const version = await CurriculumVersion.findById(versionId);

    if (!version) {
        throw createError("Khong tim thay phien ban chuong trinh", 404);
    }

    if (version.status !== "draft") {
        throw createError(
            "Chi duoc phep chinh sua ke hoach cua phien ban draft",
            409
        );
    }

    return version;
};

// =====================================================
// 2. TAO HOAC CAP NHAT KE HOACH HOC KY
// =====================================================

const saveSemesterPlan = async (data) => {
    const curriculumVersion = data.curriculumVersion;
    const semesterNumber = Number(data.semesterNumber);
    const expectedCredits = Number(data.expectedCredits);
    const note = typeof data.note === "string"
        ? data.note.trim()
        : "";

    await getCurriculumVersionOrThrow(curriculumVersion);
    validatePositiveInteger(semesterNumber, "So hoc ky");
    validateCredits(expectedCredits);

    try {
        const semesterPlan = await CurriculumSemesterPlan.findOneAndUpdate(
            {
                curriculumVersion,
                semesterNumber
            },
            {
                $set: {
                    expectedCredits,
                    note
                },
                $setOnInsert: {
                    curriculumVersion,
                    semesterNumber
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return semesterPlan;
    } catch (error) {
        if (error.code === 11000) {
            throw createError("Ke hoach hoc ky da ton tai", 409);
        }

        throw error;
    }
};

// =====================================================
// 3. LAY KE HOACH THEO PHIEN BAN CTDT
// =====================================================

const getSemesterPlans = async (curriculumVersionId) => {
    validateObjectId(curriculumVersionId, "Curriculum Version ID");

    const semesterPlans = await CurriculumSemesterPlan.find({
        curriculumVersion: curriculumVersionId
    })
        .sort({ semesterNumber: 1 })
        .lean();

    return semesterPlans;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    saveSemesterPlan,
    getSemesterPlans
};
