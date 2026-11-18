const mongoose = require("mongoose");
const academicAlertService = require(
    "../analytics/academic-alert.service"
);
const StudentProfile = require("../students/student-profile.model");
const Semester = require("./models/semester.model");
const StudentSemesterProgress = require(
    "./models/student-semester-progress.model"
);

// =====================================================
// 1. HAM HO TRO
// =====================================================

const createError = (message, statusCode = 400) => {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};

const validateObjectId = (id, fieldName) => {
    if (!mongoose.isValidObjectId(id)) {
        throw createError(`${fieldName} khong hop le`);
    }
};

const validateSemesterNumber = (semesterNumber) => {
    if (!Number.isInteger(semesterNumber) || semesterNumber < 1) {
        throw createError("So hoc ky phai la so nguyen duong");
    }
};

const findStudentOrThrow = async (studentId) => {
    validateObjectId(studentId, "Student ID");

    const student = await StudentProfile.findById(studentId);

    if (!student) {
        throw createError("Khong tim thay sinh vien", 404);
    }

    return student;
};

const findSemesterOrThrow = async (semesterId) => {
    validateObjectId(semesterId, "Semester ID");

    const semester = await Semester.findById(semesterId);

    if (!semester) {
        throw createError("Khong tim thay hoc ky", 404);
    }

    return semester;
};

// =====================================================
// 2. TAO HOAC CAP NHAT TIEN DO HOC KY
// =====================================================


const saveStudentSemesterProgress = async (data) => {
    const studentId = data.student;
    const semesterId = data.semester;
    const semesterNumber = Number(data.semesterNumber);
    const status = data.status || "planned";
    const note = typeof data.note === "string"
        ? data.note.trim()
        : "";

    const student = await findStudentOrThrow(studentId);
    const semester = await findSemesterOrThrow(semesterId);

    validateSemesterNumber(semesterNumber);

    const completedAt = status === "completed"
        ? (data.completedAt ? new Date(data.completedAt) : new Date())
        : null;

    if (
        status === "completed" &&
        Number.isNaN(completedAt.getTime())
    ) {
        throw createError(
            "Ngay hoan thanh hoc ky khong hop le"
        );
    }

    let progress;

    try {
        progress = await StudentSemesterProgress.findOneAndUpdate(
            {
                student: studentId,
                semester: semesterId
            },
            {
                $set: {
                    semesterNumber,
                    status,
                    completedAt,
                    note
                },
                $setOnInsert: {
                    student: studentId,
                    semester: semesterId
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );
    } catch (error) {
        if (error.code === 11000) {
            throw createError(
                "Sinh vien da co tien do cho hoc ky nay",
                409
            );
        }

        throw error;
    }

    // Đồng bộ cảnh báo sau khi lưu thành công
    let alertSync = {
        success: false,
        message: "Chua dong bo canh bao"
    };

    try {
        const result = await academicAlertService.generateAlerts(
            studentId
        );

        alertSync = {
            success: true,
            message: "Dong bo canh bao thanh cong",
            generatedCount: result.generated.length,
            credit: {
                assessmentStatus:
                    result.credit.assessmentStatus,
                expectedCredits:
                    result.credit.expectedCredits,
                missingCredits:
                    result.credit.missingCredits,
                hasWarning:
                    result.credit.hasWarning
            }
        };
    } catch (error) {
        console.error(
            "[StudentSemesterProgress] Alert sync failed:",
            error
        );

        alertSync = {
            success: false,
            message: "Luu tien do thanh cong nhung dong bo canh bao that bai"
        };
    }

    return {
        progress,
        alertSync
    };
};


// =====================================================
// 3. LAY TIEN DO HOC KY CUA SINH VIEN
// =====================================================

const getStudentSemesterProgresses = async (studentId) => {
    await findStudentOrThrow(studentId);

    const progresses = await StudentSemesterProgress.find({
        student: studentId
    })
        .populate("semester", "semesterCode semesterName academicYear")
        .sort({ semesterNumber: 1 })
        .lean();

    return progresses;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    saveStudentSemesterProgress,
    getStudentSemesterProgresses
};
