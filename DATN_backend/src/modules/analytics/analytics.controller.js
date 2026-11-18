
const analyticsService = require("./analytics.service");
const alertService = require("./academic-alert.service");

const handle = (service, message) => async (req, res, next) => {
    try {
        const data = await service(req);

        res.status(200).json({
            success: true,
            message,
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.getGPATrend = handle(
    req => analyticsService.getGPATrend(req.params.studentId),
    "Lấy thống kê GPA thành công"
);

exports.getSubjectAnalysis = handle(
    req => analyticsService.getSubjectAnalysis(req.params.studentId),
    "Phân tích điểm theo môn thành công"
);

exports.getAcademicRisk = handle(
    req => analyticsService.getAcademicRisk(req.params.studentId),
    "Đánh giá nguy cơ học tập thành công"
);

exports.getCreditWarning = handle(
    req => analyticsService.getCreditWarning(req.params.studentId),
    "Kiểm tra cảnh báo tín chỉ thành công"
);

exports.forecastGPA = handle(
    req => analyticsService.forecastGPA(
        req.params.studentId,
        req.body
    ),
    "Dự báo GPA thành công"
);

exports.getImprovementPlan = handle(
    req => analyticsService.getImprovementPlan(
        req.params.studentId,
        req.query.targetGPA
    ),
    "Đề xuất kế hoạch cải thiện thành công"
);

exports.getAlerts = handle(
    req => alertService.getAlerts(req.params.studentId),
    "Lấy danh sách cảnh báo thành công"
);

exports.generateAlerts = handle(
    req => alertService.generateAlerts(req.params.studentId),
    "Tạo cảnh báo học tập thành công"
);
