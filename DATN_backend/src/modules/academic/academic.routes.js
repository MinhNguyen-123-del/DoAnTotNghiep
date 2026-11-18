
const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
// Import Controller xử lý nghiệp vụ học tập
const academicController = require("./academic.controller");

// Import Schema và Middleware kiểm tra dữ liệu đầu vào
const {
    studentIdParamsSchema,
    semesterParamsSchema,
    subjectHistoryParamsSchema,
    validateParams
} = require("./academic.validation");

// Khởi tạo Router của phân hệ Academic
const router = express.Router();

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Chỉ Admin mới được nhập kết quả học tập"
        });
    }

    next();
};

// 1. API tổng quan học tập của sinh viên
// GET /api/academic/students/:studentId/summary
router.get(
    "/students/:studentId/summary",
    validateParams(studentIdParamsSchema),
    academicController.getStudentSummary
);

// 2. API xem GPA của sinh viên
// GET /api/academic/students/:studentId/gpa
router.get(
    "/students/:studentId/gpa",
    validateParams(studentIdParamsSchema),
    academicController.getStudentGPA
);

// 3. API xem tín chỉ tích lũy
// GET /api/academic/students/:studentId/credits
router.get(
    "/students/:studentId/credits",
    validateParams(studentIdParamsSchema),
    academicController.getStudentCredits
);

// 4. API xem kết quả học tập theo học kỳ
// GET /api/academic/students/:studentId/semesters/:semesterId
router.get(
    "/students/:studentId/semesters/:semesterId",
    validateParams(semesterParamsSchema),
    academicController.getStudentSemesterResults
);

// 5. API xem lịch sử học lại của môn học
// GET /api/academic/students/:studentId/subjects/:subjectId/history
router.get(
    "/students/:studentId/subjects/:subjectId/history",
    validateParams(subjectHistoryParamsSchema),
    academicController.getStudentSubjectHistory
);

// 6. API xem tiến độ đào tạo
// GET /api/academic/students/:studentId/progress
router.get(
    "/students/:studentId/progress",
    validateParams(studentIdParamsSchema),
    academicController.getStudentStudyProgress
);

// 7. API kiem tra dieu kien thuc tap
// GET /api/academic/students/:studentId/eligibility/internship
router.get(
    "/students/:studentId/eligibility/internship",
    validateParams(studentIdParamsSchema),
    academicController.getInternshipEligibility
);

// 8. API kiem tra dieu kien lam do an tot nghiep
// GET /api/academic/students/:studentId/eligibility/graduation-project
router.get(
    "/students/:studentId/eligibility/graduation-project",
    validateParams(studentIdParamsSchema),
    academicController.getGraduationProjectEligibility
);

// =====================================================
// 9. API NHẬP KẾT QUẢ HỌC TẬP
// POST /api/academic/records
// Chỉ Admin được phép nhập điểm
// =====================================================

router.post(
    "/records",
    authenticate,
    requireAdmin,
    academicController.createAcademicRecord
);

// Xuất Router để app.js đăng ký
module.exports = router;
