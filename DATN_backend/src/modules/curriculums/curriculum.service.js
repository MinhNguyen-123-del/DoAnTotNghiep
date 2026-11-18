const mongoose = require("mongoose");

const Faculty = require("./faculty.model");
const Major = require("./major.model");
const Curriculum = require("./curriculum.model");
const CurriculumVersion = require("./curriculum-version.model");
const CurriculumSubject = require("./curriculum-subject.model");
const Prerequisite = require("./prerequisite.model");
const Subject = require("../academic/models/subject.model");

// =====================================================
// 1. HAM HO TRO
// =====================================================

const createError = (message, statusCode = 400) => {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};

const validateObjectId = (id, fieldName = "ID") => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError(`${fieldName} khong hop le`);
    }
};

const normalizeObjectId = (id) => {
    return id?.toString();
};

const handleDuplicateError = (error) => {
    if (error?.code === 11000) {
        throw createError("Du lieu da ton tai hoac bi trung", 409);
    }

    throw error;
};

const findDocumentOrThrow = async (Model, id, documentName) => {
    validateObjectId(id, documentName);

    const document = await Model.findById(id);

    if (!document) {
        throw createError(`Khong tim thay ${documentName}`, 404);
    }

    return document;
};

const ensureDraftVersion = (version) => {
    if (version.status !== "draft") {
        throw createError(
            "Chi duoc phep chinh sua phien ban o trang thai draft",
            409
        );
    }
};

// =====================================================
// 2. QUAN LY KHOA
// =====================================================

const createFaculty = async (data) => {
    try {
        const faculty = await Faculty.create(data);

        return faculty;
    } catch (error) {
        handleDuplicateError(error);
    }
};

const getFaculties = async () => {
    const faculties = await Faculty.find()
        .sort({ facultyCode: 1 })
        .lean();

    return faculties;
};

// =====================================================
// 3. QUAN LY NGANH HOC
// =====================================================

const createMajor = async (data) => {
    await findDocumentOrThrow(Faculty, data.faculty, "khoa");

    try {
        const major = await Major.create(data);

        return major;
    } catch (error) {
        handleDuplicateError(error);
    }
};

const getMajors = async (facultyId) => {
    const filter = facultyId ? { faculty: facultyId } : {};

    if (facultyId) {
        validateObjectId(facultyId, "Faculty ID");
    }

    const majors = await Major.find(filter)
        .populate("faculty", "facultyCode name")
        .sort({ majorCode: 1 })
        .lean();

    return majors;
};

// =====================================================
// 4. QUAN LY MON HOC
// =====================================================

const createSubject = async (data) => {
    try {
        const subject = await Subject.create(data);

        return subject;
    } catch (error) {
        handleDuplicateError(error);
    }
};

const getSubjects = async () => {
    const subjects = await Subject.find()
        .sort({ subjectCode: 1 })
        .lean();

    return subjects;
};

// =====================================================
// 5. QUAN LY CHUONG TRINH DAO TAO
// =====================================================

const createCurriculum = async (data) => {
    if (data.major) {
        await findDocumentOrThrow(Major, data.major, "nganh");
    }

    try {
        const curriculum = await Curriculum.create(data);

        return curriculum;
    } catch (error) {
        handleDuplicateError(error);
    }
};

const getCurriculums = async () => {
    const curriculums = await Curriculum.find()
        .populate({
            path: "major",
            populate: {
                path: "faculty",
                select: "facultyCode name"
            }
        })
        .sort({ curriculumCode: 1 })
        .lean();

    return curriculums;
};

// =====================================================
// 6. QUAN LY PHIEN BAN CHUONG TRINH
// =====================================================

const createCurriculumVersion = async (data) => {
    await findDocumentOrThrow(
        Curriculum,
        data.curriculum,
        "chuong trinh dao tao"
    );

    try {
        const version = await CurriculumVersion.create(data);

        return version;
    } catch (error) {
        handleDuplicateError(error);
    }
};

const getCurriculumVersions = async (curriculumId) => {
    const filter = curriculumId
        ? { curriculum: curriculumId }
        : {};

    if (curriculumId) {
        validateObjectId(curriculumId, "Curriculum ID");
    }

    const versions = await CurriculumVersion.find(filter)
        .populate("curriculum", "curriculumCode name")
        .sort({ cohort: -1, versionCode: -1 })
        .lean();

    return versions;
};

const getCurriculumVersionDetail = async (versionId) => {
    validateObjectId(versionId, "Curriculum Version ID");

    const version = await CurriculumVersion.findById(versionId)
        .populate({
            path: "curriculum",
            populate: {
                path: "major",
                select: "majorCode name"
            }
        })
        .lean();

    if (!version) {
        throw createError("Khong tim thay phien ban chuong trinh", 404);
    }

    const subjects = await CurriculumSubject.find({
        curriculumVersion: versionId
    })
        .populate("subject", "subjectCode subjectName credits")
        .sort({ recommendedSemester: 1, createdAt: 1 })
        .lean();

    const prerequisites = await Prerequisite.find({
        curriculumVersion: versionId
    })
        .populate("subject", "subjectCode subjectName")
        .populate("prerequisiteSubject", "subjectCode subjectName")
        .lean();

    const creditSummary = subjects.reduce(
        (summary, curriculumSubject) => {
            const credits = Number(curriculumSubject.credits) || 0;

            summary.totalListedCredits += credits;

            if (curriculumSubject.isRequired) {
                summary.requiredCredits += credits;
                summary.requiredSubjectCount += 1;
            } else {
                summary.electiveCredits += credits;
                summary.electiveSubjectCount += 1;
            }

            return summary;
        },
        {
            requiredCredits: 0,
            electiveCredits: 0,
            totalListedCredits: 0,
            requiredSubjectCount: 0,
            electiveSubjectCount: 0,
            totalCreditsRequired: version.totalCreditsRequired,
            // Electives may mean this is positive; it is informational only.
            creditDifference: 0
        }
    );

    creditSummary.creditDifference =
        creditSummary.totalListedCredits - creditSummary.totalCreditsRequired;

    return {
        ...version,
        subjects,
        prerequisites,
        creditSummary
    };
};

// =====================================================
// 7. MON HOC TRONG PHIEN BAN
// =====================================================


const addSubjectToCurriculumVersion = async (versionId, data) => {
    const version = await findDocumentOrThrow(
        CurriculumVersion,
        versionId,
        "phien ban chuong trinh"
    );

    ensureDraftVersion(version);

    await findDocumentOrThrow(
        Subject,
        data.subject,
        "mon hoc"
    );

    try {
        const curriculumSubject = await CurriculumSubject.create({
            ...data,
            curriculum: version.curriculum,
            curriculumVersion: version._id
        });

        // Tính lại tổng tín chỉ các môn bắt buộc
        const result = await CurriculumSubject.aggregate([
            {
                $match: {
                    curriculumVersion: version._id,
                    isRequired: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalCredits: { $sum: "$credits" }
                }
            }
        ]);

        const totalCredits = result[0]?.totalCredits || 0;

        // Cập nhật tổng tín chỉ của phiên bản
        await CurriculumVersion.findByIdAndUpdate(
            version._id,
            {
                totalCreditsRequired: totalCredits
            }
        );

        return curriculumSubject;

    } catch (error) {
        handleDuplicateError(error);
    }
};


// =====================================================
// 8. DIEU KIEN TIEN QUYET
// =====================================================

const hasPrerequisitePath = async (
    versionId,
    startSubjectId,
    targetSubjectId
) => {
    const normalizedStartSubjectId = normalizeObjectId(startSubjectId);
    const normalizedTargetSubjectId = normalizeObjectId(targetSubjectId);

    const prerequisites = await Prerequisite.find({
        curriculumVersion: versionId,
        type: "prerequisite"
    }).lean();

    const prerequisiteGraph = new Map();

    for (const prerequisite of prerequisites) {
        const subjectId = prerequisite.subject.toString();
        const prerequisiteId = prerequisite.prerequisiteSubject.toString();

        if (!prerequisiteGraph.has(subjectId)) {
            prerequisiteGraph.set(subjectId, []);
        }

        prerequisiteGraph.get(subjectId).push(prerequisiteId);
    }

    const visitedSubjectIds = new Set();

    const visitSubject = (subjectId) => {
        if (subjectId === normalizedTargetSubjectId) {
            return true;
        }

        if (visitedSubjectIds.has(subjectId)) {
            return false;
        }

        visitedSubjectIds.add(subjectId);

        const nextSubjectIds = prerequisiteGraph.get(subjectId) || [];

        return nextSubjectIds.some(visitSubject);
    };

    return visitSubject(normalizedStartSubjectId);
};

const addPrerequisite = async (versionId, data) => {
    const version = await findDocumentOrThrow(
        CurriculumVersion,
        versionId,
        "phien ban chuong trinh"
    );

    ensureDraftVersion(version);

    validateObjectId(data.subject, "Subject ID");
    validateObjectId(
        data.prerequisiteSubject,
        "Prerequisite Subject ID"
    );

    const subjectId = normalizeObjectId(data.subject);
    const prerequisiteSubjectId = normalizeObjectId(
        data.prerequisiteSubject
    );

    if (subjectId === prerequisiteSubjectId) {
        throw createError("Mon hoc khong the la dieu kien cua chinh no");
    }

    const subjectCount = await CurriculumSubject.countDocuments({
        curriculumVersion: versionId,
        subject: {
            $in: [data.subject, data.prerequisiteSubject]
        }
    });

    if (subjectCount !== 2) {
        throw createError(
            "Hai mon hoc phai cung thuoc phien ban chuong trinh",
            422
        );
    }

    const prerequisiteType = data.type || "prerequisite";

    if (prerequisiteType === "prerequisite") {
        const createsCycle = await hasPrerequisitePath(
            versionId,
            prerequisiteSubjectId,
            subjectId
        );

        if (createsCycle) {
            throw createError("Dieu kien tien quyet tao thanh chu trinh", 422);
        }
    }

    try {
        const prerequisite = await Prerequisite.create({
            ...data,
            curriculumVersion: versionId
        });

        return prerequisite;
    } catch (error) {
        handleDuplicateError(error);
    }
};

const removePrerequisite = async (versionId, prerequisiteId) => {
    validateObjectId(versionId, "Curriculum Version ID");
    validateObjectId(prerequisiteId, "Prerequisite ID");

    const version = await findDocumentOrThrow(
        CurriculumVersion,
        versionId,
        "phien ban chuong trinh"
    );

    ensureDraftVersion(version);

    const prerequisite = await Prerequisite.findOneAndDelete({
        _id: prerequisiteId,
        curriculumVersion: versionId
    });

    if (!prerequisite) {
        throw createError("Khong tim thay dieu kien tien quyet", 404);
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createFaculty,
    getFaculties,
    createMajor,
    getMajors,
    createSubject,
    getSubjects,
    createCurriculum,
    getCurriculums,
    createCurriculumVersion,
    getCurriculumVersions,
    getCurriculumVersionDetail,
    addSubjectToCurriculumVersion,
    addPrerequisite,
    removePrerequisite
};
