
const mongoose = require("mongoose");
const CurriculumSemesterPlan = require(
    "../curriculums/curriculum-semester-plan.model"
);
const AcademicService = require("../academic/academic.service");
const StudentProfile = require("../students/student-profile.model");
const StudentSemesterProgress = require(
    "../academic/models/student-semester-progress.model"
);

const config = require("./analytics.config");

const round = (value) => Number(value.toFixed(2));

// Lấy dữ liệu sinh viên và kết quả học tập
const getStudentData = async (studentId) => {
    if (!mongoose.isValidObjectId(studentId)) {
        const error = new Error("Student ID không hợp lệ");
        error.statusCode = 400;
        throw error;
    }

    const student = await StudentProfile.findById(studentId).lean();

    if (!student) {
        const error = new Error("Không tìm thấy sinh viên");
        error.statusCode = 404;
        throw error;
    }

    const records = await AcademicService.getConfirmedRecords(studentId);

    return { student, records };
};

const getSubjectId = (record) =>
    record.subject?._id?.toString() ||
    record.subject?.toString();

const getSemesterId = (record) =>
    record.semester?._id?.toString() ||
    record.semester?.toString();

// Lấy lần học mới nhất của từng môn
const getLatestAttempts = (records) => {
    const map = new Map();

    for (const record of records) {
        const subjectId = getSubjectId(record);
        if (!subjectId) continue;

        const old = map.get(subjectId);

        if (
            !old ||
            Number(record.attemptNumber || 0) >
                Number(old.attemptNumber || 0)
        ) {
            map.set(subjectId, record);
        }
    }

    return [...map.values()];
};

// Tính GPA theo tín chỉ
const calculateGPA = (records) => {
    const latest = getLatestAttempts(records);

    let totalPoints = 0;
    let totalCredits = 0;

    for (const record of latest) {
        if (record.includedInGPA !== true) continue;

        const grade = Number(record.gradePoint4);
        const credits = Number(record.creditsSnapshot);

        if (
            record.gradePoint4 == null ||
            !Number.isFinite(grade) ||
            !Number.isFinite(credits) ||
            credits <= 0
        ) {
            continue;
        }

        totalPoints += grade * credits;
        totalCredits += credits;
    }

    return {
        gpa: totalCredits > 0
            ? round(totalPoints / totalCredits)
            : null,
        totalPoints,
        totalCredits
    };
};

// 1. Thống kê GPA theo học kỳ
const getGPATrend = async (studentId) => {
    const { student, records } = await getStudentData(studentId);

    const semesterMap = new Map();

    for (const record of records) {
        const semesterId = getSemesterId(record);
        if (!semesterId) continue;

        if (!semesterMap.has(semesterId)) {
            semesterMap.set(semesterId, {
                semester: record.semester,
                records: []
            });
        }

        semesterMap.get(semesterId).records.push(record);
    }

    const trend = [];

    for (const [semesterId, item] of semesterMap) {
        const result = calculateGPA(item.records);

        trend.push({
            semesterId,
            semesterName:
                item.semester?.name ||
                item.semester?.semesterName ||
                null,
            semesterGPA: result.gpa,
            totalCredits: result.totalCredits
        });
    }

    const cumulative = calculateGPA(records);

    return {
        studentId: student._id,
        studentCode: student.studentCode,
        cumulativeGPA: cumulative.gpa,
        trend
    };
};

// 2. Phân tích điểm theo môn
const getSubjectAnalysis = async (studentId) => {
    const { student, records } = await getStudentData(studentId);

    const latest = getLatestAttempts(records);

    const subjects = latest.map(record => ({
        subjectId: getSubjectId(record),
        subjectCode:
            record.subject?.subjectCode ||
            record.subject?.code ||
            null,
        subjectName:
            record.subject?.subjectName ||
            record.subject?.name ||
            null,
        credits: Number(record.creditsSnapshot || 0),
        gradePoint4: record.gradePoint4,
        isPassed: record.isPassed,
        attemptNumber: record.attemptNumber
    }));

    return {
        studentId: student._id,
        totalSubjects: subjects.length,
        passedSubjects: subjects.filter(
            item => item.isPassed === true
        ).length,
        failedSubjects: subjects.filter(
            item => item.isPassed === false
        ).length,
        subjects
    };
};

// 3. Đánh giá nguy cơ học tập
const getAcademicRisk = async (studentId) => {
    const { student, records } = await getStudentData(studentId);

    const gpa = calculateGPA(records);
    const latest = getLatestAttempts(records);

    const failedSubjects = latest.filter(
        record => record.isPassed === false
    ).length;

    const reasons = [];
    let riskLevel = "low";

    if (gpa.gpa !== null && gpa.gpa < config.lowGPA) {
        reasons.push("GPA thấp hơn ngưỡng cảnh báo");

        riskLevel = gpa.gpa < config.severeGPA
            ? "high"
            : "medium";
    }

    if (failedSubjects > 0) {
        reasons.push(
            `Có ${failedSubjects} học phần chưa đạt`
        );

        if (riskLevel === "low") riskLevel = "medium";
    }

    return {
        studentId: student._id,
        currentGPA: gpa.gpa,
        failedSubjects,
        riskLevel,
        hasRisk: reasons.length > 0,
        reasons
    };
};

// 4. Cảnh báo thiếu tín chỉ

const getCreditWarning = async (studentId) => {
    const { student } = await getStudentData(studentId);
    const result = await AcademicService.getStudyProgress(studentId);

    const earnedCredits = Number(
        result.progress.earnedCredits || 0
    );

    const totalCreditsRequired = Number(
        result.curriculum.totalCreditsRequired || 0
    );

    const remainingCredits = Number(
        result.progress.remainingCredits || 0
    );

    const baseResult = {
        studentId: student._id,
        earnedCredits,
        totalCreditsRequired,
        remainingCredits,
        expectedCredits: null,
        missingCredits: null,
        hasWarning: false,
        assessmentStatus: "insufficient_data"
    };

    if (student.academicStatus !== "studying") {
        return {
            ...baseResult,
            note: "Sinh vien khong o trang thai dang hoc."
        };
    }

    if (!student.curriculumVersion) {
        return {
            ...baseResult,
            note: "Thieu phien ban CTDT."
        };
    }

    const completedProgresses = await StudentSemesterProgress.find({
        student: student._id,
        status: "completed"
    })
        .sort({ semesterNumber: 1 })
        .lean();

    if (completedProgresses.length === 0) {
        return {
            ...baseResult,
            completedSemesterCount: 0,
            note: "Chua co hoc ky hoan thanh de danh gia."
        };
    }

    const completedSemesterNumbers = completedProgresses.map(
        (progress) => progress.semesterNumber
    );

    const highestCompletedSemesterNumber = Math.max(
        ...completedSemesterNumbers
    );

    const missingCompletedSemesterNumbers = [];

    for (
        let semesterNumber = 1;
        semesterNumber <= highestCompletedSemesterNumber;
        semesterNumber++
    ) {
        if (!completedSemesterNumbers.includes(semesterNumber)) {
            missingCompletedSemesterNumbers.push(semesterNumber);
        }
    }

    if (missingCompletedSemesterNumbers.length > 0) {
        return {
            ...baseResult,
            completedSemesterNumbers,
            missingCompletedSemesterNumbers,
            note: "Du lieu hoc ky hoan thanh khong lien tuc tu hoc ky 1."
        };
    }

    const completedSemesterCount = highestCompletedSemesterNumber;

    const semesterPlans = await CurriculumSemesterPlan.find({
        curriculumVersion: student.curriculumVersion,
        semesterNumber: {
            $lte: completedSemesterCount
        }
    }).lean();

    const planBySemesterNumber = new Map();

    for (const semesterPlan of semesterPlans) {
        planBySemesterNumber.set(
            semesterPlan.semesterNumber,
            semesterPlan
        );
    }

    const missingSemesterNumbers = [];

    for (
        let semesterNumber = 1;
        semesterNumber <= completedSemesterCount;
        semesterNumber++
    ) {
        if (!planBySemesterNumber.has(semesterNumber)) {
            missingSemesterNumbers.push(semesterNumber);
        }
    }

    // Khong du lieu ke hoach cho mot hoc ky da hoan thanh
    // thi khong the ket luan sinh vien cham tien do.
    if (missingSemesterNumbers.length > 0) {
        return {
            ...baseResult,
            completedSemesterCount,
            missingSemesterNumbers,
            note: "Thieu ke hoach tin chi cho hoc ky da hoan thanh."
        };
    }

    const expectedCredits = semesterPlans
        .reduce(
            (sum, item) => sum + Number(item.expectedCredits || 0),
            0
        );

    const missingCredits = Math.max(
        0,
        expectedCredits - earnedCredits
    );

    return {
        ...baseResult,
        completedSemesterCount,
        expectedCredits,
        missingCredits,
        hasWarning: missingCredits > 0,
        assessmentStatus: "assessed",
        note:
            missingCredits > 0
                ? `Sinh vien cham ${missingCredits} tin chi so voi tien do du kien.`
                : "Sinh vien dap ung tien do tin chi du kien."
    };
};


// 5. Dự báo GPA
const forecastGPA = async (studentId, input = {}) => {
    const { records } = await getStudentData(studentId);

    const current = calculateGPA(records);

    const targetGPA = Number(input.targetGPA);
    const futureCredits = Number(input.futureCredits);

    if (
        input.targetGPA == null ||
        input.futureCredits == null ||
        !Number.isFinite(targetGPA) ||
        targetGPA < 0 ||
        targetGPA > 4 ||
        !Number.isInteger(futureCredits) ||
        futureCredits <= 0
    ) {
        const error = new Error(
            "targetGPA phải từ 0 đến 4 và futureCredits phải là số nguyên dương"
        );
        error.statusCode = 400;
        throw error;
    }

    const requiredAverage = (
        targetGPA * (current.totalCredits + futureCredits) -
        current.totalPoints
    ) / futureCredits;

    const maximumPossibleGPA = (
        current.totalPoints + 4 * futureCredits
    ) / (current.totalCredits + futureCredits);

    return {
        currentGPA: current.gpa,
        currentGPACredits: current.totalCredits,
        targetGPA,
        futureCredits,
        requiredAverageGPA: round(requiredAverage),
        maximumPossibleGPA: round(maximumPossibleGPA),
        achievable: requiredAverage <= 4,
        assumptions: [
            "Thang điểm GPA tối đa 4.0",
            "Các tín chỉ tương lai đều được tính vào GPA",
            "Không xét thay thế điểm khi học lại"
        ]
    };
};

// 6. Đề xuất kế hoạch cải thiện
const getImprovementPlan = async (
    studentId,
    targetGPA = config.defaultTargetGPA
) => {
    const progress = await AcademicService.getStudyProgress(studentId);

    const { records } = await getStudentData(studentId);

    const current = calculateGPA(records);

    const remainingCredits = Number(
        progress.progress.remainingCredits || 0
    );

    const recommendations = [];
    let forecast = null;

    if (remainingCredits > 0) {
        forecast = await forecastGPA(studentId, {
            targetGPA,
            futureCredits: remainingCredits
        });

        if (forecast.achievable) {
            recommendations.push(
                `Cần đạt GPA trung bình khoảng ${Math.max(0, forecast.requiredAverageGPA)} ở các tín chỉ tiếp theo`
            );
        } else {
            recommendations.push(
                "Mục tiêu GPA không khả thi với số tín chỉ còn lại"
            );
        }
    }

    return {
        studentId,
        currentGPA: current.gpa,
        targetGPA: Number(targetGPA),
        remainingCredits,
        forecast,
        recommendations
    };
};

module.exports = {
    getGPATrend,
    getSubjectAnalysis,
    getAcademicRisk,
    getCreditWarning,
    forecastGPA,
    getImprovementPlan
};
