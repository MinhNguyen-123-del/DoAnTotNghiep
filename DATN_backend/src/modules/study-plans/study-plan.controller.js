
const studyPlanService = require("./study-plan.service");

// Hàm xử lý phản hồi thành công
const successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Hàm xử lý lỗi
const errorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Đã xảy ra lỗi máy chủ",
  });
};

// Lấy ID sinh viên từ params hoặc body
const getStudentId = (req) => {
  return req.params.studentId || req.body.studentId;
};

// ======================================================
// 1. QUẢN LÝ KẾ HOẠCH HỌC TẬP
// ======================================================

// Tạo kế hoạch học tập
const createStudyPlan = async (req, res) => {
  try {
    const result = await studyPlanService.createStudyPlan({
      studentId: getStudentId(req),
      semesterId: req.body.semesterId,
      planName: req.body.planName,
      description: req.body.description,
    });

    return successResponse(
      res,
      "Tạo kế hoạch học tập thành công",
      result,
      201
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Lấy danh sách kế hoạch học tập
const getStudyPlans = async (req, res) => {
  try {
    const result = await studyPlanService.getStudyPlans(
      getStudentId(req)
    );

    return successResponse(
      res,
      "Lấy danh sách kế hoạch học tập thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Lấy chi tiết kế hoạch học tập
const getStudyPlanDetail = async (req, res) => {
  try {
    const result = await studyPlanService.getStudyPlanDetail(
      getStudentId(req),
      req.params.studyPlanId
    );

    return successResponse(
      res,
      "Lấy chi tiết kế hoạch học tập thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Cập nhật kế hoạch học tập
const updateStudyPlan = async (req, res) => {
  try {
    const result = await studyPlanService.updateStudyPlan(
      getStudentId(req),
      req.params.studyPlanId,
      req.body
    );

    return successResponse(
      res,
      "Cập nhật kế hoạch học tập thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Xóa kế hoạch học tập
const deleteStudyPlan = async (req, res) => {
  try {
    const result = await studyPlanService.deleteStudyPlan(
      getStudentId(req),
      req.params.studyPlanId
    );

    return successResponse(
      res,
      result.message,
      null
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ======================================================
// 2. QUẢN LÝ MÔN HỌC DỰ KIẾN
// ======================================================

// Thêm môn học vào kế hoạch
const addPlannedCourse = async (req, res) => {
  try {
    const result = await studyPlanService.addPlannedCourse(
      getStudentId(req),
      req.params.studyPlanId,
      req.body
    );

    return successResponse(
      res,
      "Thêm môn học vào kế hoạch thành công",
      result,
      201
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Lấy danh sách môn học dự kiến
const getPlannedCourses = async (req, res) => {
  try {
    const result = await studyPlanService.getPlannedCourses(
      getStudentId(req),
      req.params.studyPlanId
    );

    return successResponse(
      res,
      "Lấy danh sách môn học dự kiến thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Cập nhật trạng thái môn học dự kiến
const updatePlannedCourse = async (req, res) => {
  try {
    const result = await studyPlanService.updatePlannedCourse(
      getStudentId(req),
      req.params.studyPlanId,
      req.params.plannedCourseId,
      req.body
    );

    return successResponse(
      res,
      "Cập nhật môn học dự kiến thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Hủy môn học dự kiến
const removePlannedCourse = async (req, res) => {
  try {
    const result = await studyPlanService.removePlannedCourse(
      getStudentId(req),
      req.params.studyPlanId,
      req.params.plannedCourseId
    );

    return successResponse(
      res,
      result.message,
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ======================================================
// 3. QUẢN LÝ CÔNG VIỆC
// ======================================================

// Tạo công việc
const createTask = async (req, res) => {
  try {
    const result = await studyPlanService.createTask(
      getStudentId(req),
      req.params.studyPlanId,
      req.body
    );

    return successResponse(
      res,
      "Tạo công việc thành công",
      result,
      201
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Lấy danh sách công việc
const getTasks = async (req, res) => {
  try {
    const result = await studyPlanService.getTasks(
      getStudentId(req),
      req.params.studyPlanId
    );

    return successResponse(
      res,
      "Lấy danh sách công việc thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Cập nhật công việc
const updateTask = async (req, res) => {
  try {
    const result = await studyPlanService.updateTask(
      getStudentId(req),
      req.params.studyPlanId,
      req.params.taskId,
      req.body
    );

    return successResponse(
      res,
      "Cập nhật công việc thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Xóa công việc
const deleteTask = async (req, res) => {
  try {
    const result = await studyPlanService.deleteTask(
      getStudentId(req),
      req.params.studyPlanId,
      req.params.taskId
    );

    return successResponse(
      res,
      result.message,
      null
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ======================================================
// 4. QUẢN LÝ MỤC TIÊU HỌC TẬP
// ======================================================

// Tạo mục tiêu học tập
const createStudyGoal = async (req, res) => {
  try {
    const result = await studyPlanService.createStudyGoal(
      getStudentId(req),
      req.params.studyPlanId,
      req.body
    );

    return successResponse(
      res,
      "Tạo mục tiêu học tập thành công",
      result,
      201
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Lấy danh sách mục tiêu học tập
const getStudyGoals = async (req, res) => {
  try {
    const result = await studyPlanService.getStudyGoals(
      getStudentId(req),
      req.params.studyPlanId
    );

    return successResponse(
      res,
      "Lấy danh sách mục tiêu học tập thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Cập nhật mục tiêu học tập
const updateStudyGoal = async (req, res) => {
  try {
    const result = await studyPlanService.updateStudyGoal(
      getStudentId(req),
      req.params.studyPlanId,
      req.params.goalId,
      req.body
    );

    return successResponse(
      res,
      "Cập nhật mục tiêu học tập thành công",
      result
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Xóa mục tiêu học tập
const deleteStudyGoal = async (req, res) => {
  try {
    const result = await studyPlanService.deleteStudyGoal(
      getStudentId(req),
      req.params.studyPlanId,
      req.params.goalId
    );

    return successResponse(
      res,
      result.message,
      null
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ======================================================
// EXPORT CONTROLLER
// ======================================================

module.exports = {
  createStudyPlan,
  getStudyPlans,
  getStudyPlanDetail,
  updateStudyPlan,
  deleteStudyPlan,

  addPlannedCourse,
  getPlannedCourses,
  updatePlannedCourse,
  removePlannedCourse,

  createTask,
  getTasks,
  updateTask,
  deleteTask,

  createStudyGoal,
  getStudyGoals,
  updateStudyGoal,
  deleteStudyGoal,
};
