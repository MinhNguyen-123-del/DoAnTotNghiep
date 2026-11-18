
const mongoose = require("mongoose");
const AcademicAlert = require("./academic-alert.model");
const analyticsService = require("./analytics.service");
const config = require("./analytics.config");

// Lấy danh sách cảnh báo của sinh viên
const getAlerts = async (studentId) => {
    if (!mongoose.isValidObjectId(studentId)) {
        const error = new Error("Student ID không hợp lệ");
        error.statusCode = 400;
        throw error;
    }

    const alerts = await AcademicAlert.find({
        student: studentId
    })
        .sort({ detectedAt: -1 })
        .lean();

    return {
        studentId,
        total: alerts.length,
        alerts
    };
};

// hasWarning:
// true  = có cảnh báo
// false = đã hết điều kiện cảnh báo
// null  = không đủ dữ liệu, giữ nguyên trạng thái
const upsertAlert = async (
    studentId,
    type,
    hasWarning,
    payload
) => {
    // Không thay đổi cảnh báo khi thiếu dữ liệu
    if (hasWarning === null) {
        return null;
    }

    // Giải quyết cảnh báo
    if (hasWarning === false) {
        await AcademicAlert.updateMany(
            {
                student: studentId,
                type,
                status: "active"
            },
            {
                $set: {
                    status: "resolved",
                    resolvedAt: new Date()
                }
            }
        );

        return null;
    }

    if (hasWarning !== true) {
        throw new Error(
            "Trạng thái cảnh báo không hợp lệ"
        );
    }

    // Tìm cảnh báo đang hoạt động
    const existing = await AcademicAlert.findOne({
        student: studentId,
        type,
        status: "active"
    });

    if (existing) {
        existing.severity = payload.severity;
        existing.title = payload.title;
        existing.message = payload.message;
        existing.details = payload.details;

        // Giữ detectedAt là thời điểm phát hiện ban đầu
        await existing.save();

        return existing;
    }

    // Tạo cảnh báo mới
    return AcademicAlert.create({
        student: studentId,
        type,
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        details: payload.details,
        status: "active",
        detectedAt: new Date()
    });
};

// Phân tích và đồng bộ cảnh báo
const generateAlerts = async (studentId) => {
    const risk = await analyticsService.getAcademicRisk(
        studentId
    );

    const credit = await analyticsService.getCreditWarning(
        studentId
    );

    const lowGPA =
        risk.currentGPA !== null &&
        risk.currentGPA < config.lowGPA;

    const gpaAlert = await upsertAlert(
        studentId,
        "low_gpa",
        risk.currentGPA === null ? null : lowGPA,
        {
            severity:
                risk.currentGPA !== null &&
                risk.currentGPA < config.severeGPA
                    ? "high"
                    : "medium",
            title: "Cảnh báo GPA thấp",
            message: `GPA hiện tại là ${risk.currentGPA}`,
            details: {
                currentGPA: risk.currentGPA,
                minimumGPA: config.lowGPA
            }
        }
    );

    const failedAlert = await upsertAlert(
        studentId,
        "failed_subject",
        risk.failedSubjects > 0,
        {
            severity:
                risk.failedSubjects >= 3
                    ? "high"
                    : "medium",
            title: "Cảnh báo học phần chưa đạt",
            message:
                `Sinh viên có ${risk.failedSubjects} học phần chưa đạt`,
            details: {
                failedSubjects: risk.failedSubjects
            }
        }
    );

    // Chỉ đánh giá khi có đầy đủ dữ liệu
    let creditWarningState = null;

    if (credit.assessmentStatus === "assessed") {
        creditWarningState = credit.hasWarning === true;
    }

    const creditAlert = await upsertAlert(
        studentId,
        "insufficient_credits",
        creditWarningState,
        {
            severity: "medium",
            title: "Cảnh báo chậm tiến độ tín chỉ",
            message:
                `Sinh viên thiếu ${credit.missingCredits} tín chỉ so với tiến độ dự kiến`,
            details: credit
        }
    );

    return {
        studentId,
        generated: [
            gpaAlert,
            failedAlert,
            creditAlert
        ].filter(Boolean),
        risk,
        credit
    };
};

module.exports = {
    getAlerts,
    generateAlerts
};
