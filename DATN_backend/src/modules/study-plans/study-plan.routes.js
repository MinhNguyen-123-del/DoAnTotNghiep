
const express = require("express");
const router = express.Router();

const studyPlanController = require("./study-plan.controller");
const validation = require("./study-plan.validation");

// ======================================================
// MIDDLEWARE KIỂM TRA DỮ LIỆU
// ======================================================

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.details.map((item) => item.message),
      });
    }

    req[source] = value;
    next();
  };
};

// ======================================================
// 1. KẾ HOẠCH HỌC TẬP
// ======================================================

// Tạo kế hoạch
router.post(
  "/students/:studentId",
  validate(validation.studentIdParamsSchema, "params"),
  validate(validation.createStudyPlanSchema),
  studyPlanController.createStudyPlan
);

// Lấy danh sách kế hoạch
router.get(
  "/students/:studentId",
  validate(validation.studentIdParamsSchema, "params"),
  studyPlanController.getStudyPlans
);

// Lấy chi tiết kế hoạch
router.get(
  "/students/:studentId/:studyPlanId",
  validate(validation.studyPlanParamsSchema, "params"),
  studyPlanController.getStudyPlanDetail
);

// Cập nhật kế hoạch
router.patch(
  "/students/:studentId/:studyPlanId",
  validate(validation.studyPlanParamsSchema, "params"),
  validate(validation.updateStudyPlanSchema),
  studyPlanController.updateStudyPlan
);

// Xóa kế hoạch
router.delete(
  "/students/:studentId/:studyPlanId",
  validate(validation.studyPlanParamsSchema, "params"),
  studyPlanController.deleteStudyPlan
);

// ======================================================
// 2. MÔN HỌC DỰ KIẾN
// ======================================================

// Thêm môn học dự kiến
router.post(
  "/students/:studentId/:studyPlanId/courses",
  validate(validation.studyPlanParamsSchema, "params"),
  validate(validation.addPlannedCourseSchema),
  studyPlanController.addPlannedCourse
);

// Lấy danh sách môn học dự kiến
router.get(
  "/students/:studentId/:studyPlanId/courses",
  validate(validation.studyPlanParamsSchema, "params"),
  studyPlanController.getPlannedCourses
);

// Cập nhật trạng thái môn học
router.patch(
  "/students/:studentId/:studyPlanId/courses/:plannedCourseId",
  validate(validation.plannedCourseParamsSchema, "params"),
  validate(validation.updatePlannedCourseSchema),
  studyPlanController.updatePlannedCourse
);

// Hủy môn học dự kiến
router.delete(
  "/students/:studentId/:studyPlanId/courses/:plannedCourseId",
  validate(validation.plannedCourseParamsSchema, "params"),
  studyPlanController.removePlannedCourse
);

// ======================================================
// 3. CÔNG VIỆC
// ======================================================

// Tạo công việc
router.post(
  "/students/:studentId/:studyPlanId/tasks",
  validate(validation.studyPlanParamsSchema, "params"),
  validate(validation.createTaskSchema),
  studyPlanController.createTask
);

// Lấy danh sách công việc
router.get(
  "/students/:studentId/:studyPlanId/tasks",
  validate(validation.studyPlanParamsSchema, "params"),
  studyPlanController.getTasks
);

// Cập nhật công việc
router.patch(
  "/students/:studentId/:studyPlanId/tasks/:taskId",
  validate(validation.taskParamsSchema, "params"),
  validate(validation.updateTaskSchema),
  studyPlanController.updateTask
);

// Xóa công việc
router.delete(
  "/students/:studentId/:studyPlanId/tasks/:taskId",
  validate(validation.taskParamsSchema, "params"),
  studyPlanController.deleteTask
);

// ======================================================
// 4. MỤC TIÊU HỌC TẬP
// ======================================================

// Tạo mục tiêu
router.post(
  "/students/:studentId/:studyPlanId/goals",
  validate(validation.studyPlanParamsSchema, "params"),
  validate(validation.createStudyGoalSchema),
  studyPlanController.createStudyGoal
);

// Lấy danh sách mục tiêu
router.get(
  "/students/:studentId/:studyPlanId/goals",
  validate(validation.studyPlanParamsSchema, "params"),
  studyPlanController.getStudyGoals
);

// Cập nhật mục tiêu
router.patch(
  "/students/:studentId/:studyPlanId/goals/:goalId",
  validate(validation.studyGoalParamsSchema, "params"),
  validate(validation.updateStudyGoalSchema),
  studyPlanController.updateStudyGoal
);

// Xóa mục tiêu
router.delete(
  "/students/:studentId/:studyPlanId/goals/:goalId",
  validate(validation.studyGoalParamsSchema, "params"),
  studyPlanController.deleteStudyGoal
);

module.exports = router;
