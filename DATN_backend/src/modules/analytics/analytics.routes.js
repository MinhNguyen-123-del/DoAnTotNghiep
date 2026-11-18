
const express = require("express");
const router = express.Router();

const authenticate = require("../../middlewares/auth.middleware");

const controller = require("./analytics.controller");

router.use(authenticate);

// Tạm thời chỉ cho admin truy cập.
// Sau này có thể mở cho sinh viên xem dữ liệu của chính mình.
router.use((req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền truy cập"
        });
    }

    next();
});

router.get(
    "/students/:studentId/gpa-trend",
    controller.getGPATrend
);

router.get(
    "/students/:studentId/subjects",
    controller.getSubjectAnalysis
);

router.get(
    "/students/:studentId/risk",
    controller.getAcademicRisk
);

router.get(
    "/students/:studentId/credit-warning",
    controller.getCreditWarning
);

router.post(
    "/students/:studentId/gpa-forecast",
    controller.forecastGPA
);

router.get(
    "/students/:studentId/improvement-plan",
    controller.getImprovementPlan
);

router.get(
    "/students/:studentId/alerts",
    controller.getAlerts
);

router.post(
    "/students/:studentId/alerts/generate",
    controller.generateAlerts
);

module.exports = router;
