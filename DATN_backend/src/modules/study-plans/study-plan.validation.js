
const Joi = require("joi");

// ======================================================
// CẤU HÌNH OBJECT ID
// ======================================================

const objectIdSchema = Joi.string()
  .hex()
  .length(24)
  .required()
  .messages({
    "string.hex": "ID phải là ObjectId hợp lệ",
    "string.length": "ID phải có đúng 24 ký tự",
    "any.required": "ID không được để trống",
  });

// ======================================================
// 1. VALIDATION CHO KẾ HOẠCH HỌC TẬP
// ======================================================

// Kiểm tra ID sinh viên
const studentIdParamsSchema = Joi.object({
  studentId: objectIdSchema,
});

// Kiểm tra ID kế hoạch học tập
const studyPlanParamsSchema = Joi.object({
  studentId: objectIdSchema,
  studyPlanId: objectIdSchema,
});

// Kiểm tra dữ liệu tạo kế hoạch
const createStudyPlanSchema = Joi.object({
  semesterId: objectIdSchema,

  planName: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required()
    .messages({
      "string.empty": "Tên kế hoạch không được để trống",
      "string.min": "Tên kế hoạch phải có ít nhất 2 ký tự",
      "string.max": "Tên kế hoạch không được vượt quá 150 ký tự",
      "any.required": "Vui lòng nhập tên kế hoạch",
    }),

  description: Joi.string()
    .trim()
    .allow("")
    .max(1000)
    .optional(),
});

// Kiểm tra dữ liệu cập nhật kế hoạch
const updateStudyPlanSchema = Joi.object({
  planName: Joi.string()
    .trim()
    .min(2)
    .max(150),

  description: Joi.string()
    .trim()
    .allow("")
    .max(1000),

  status: Joi.string()
    .valid("draft", "active", "completed", "cancelled"),
})
  .min(1)
  .messages({
    "object.min": "Vui lòng cung cấp ít nhất một trường cần cập nhật",
  });

// ======================================================
// 2. VALIDATION CHO MÔN HỌC DỰ KIẾN
// ======================================================

const plannedCourseParamsSchema = Joi.object({
  studentId: objectIdSchema,
  studyPlanId: objectIdSchema,
  plannedCourseId: objectIdSchema,
});

// Kiểm tra dữ liệu thêm môn học
const addPlannedCourseSchema = Joi.object({
  subject: objectIdSchema,

  // Tín chỉ được lấy từ Subject trong Service
  // Không nhận creditsSnapshot từ phía Client

  note: Joi.string()
    .trim()
    .allow("")
    .max(1000)
    .optional(),
});

// Kiểm tra cập nhật trạng thái môn học
const updatePlannedCourseSchema = Joi.object({
  status: Joi.string()
    .valid("planned", "approved", "rejected", "cancelled")
    .required(),

  rejectionReason: Joi.string()
    .trim()
    .allow("")
    .max(500)
    .optional(),

  note: Joi.string()
    .trim()
    .allow("")
    .max(1000)
    .optional(),
}).custom((value, helpers) => {
  if (
    value.status === "rejected" &&
    !value.rejectionReason?.trim()
  ) {
    return helpers.error("any.custom", {
      message: "Vui lòng nhập lý do từ chối môn học",
    });
  }

  return value;
}).messages({
  "any.custom": "{{#message}}",
});

// ======================================================
// 3. VALIDATION CHO CÔNG VIỆC
// ======================================================

const taskParamsSchema = Joi.object({
  studentId: objectIdSchema,
  studyPlanId: objectIdSchema,
  taskId: objectIdSchema,
});

// Kiểm tra dữ liệu tạo công việc
const createTaskSchema = Joi.object({
  plannedCourse: Joi.string()
    .hex()
    .length(24)
    .allow(null)
    .optional(),

  title: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  description: Joi.string()
    .trim()
    .allow("")
    .max(2000)
    .optional(),

  dueDate: Joi.date()
    .iso()
    .required(),

  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .default("medium"),
});

// Kiểm tra dữ liệu cập nhật công việc
const updateTaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(2)
    .max(200),

  description: Joi.string()
    .trim()
    .allow("")
    .max(2000),

  dueDate: Joi.date().iso(),

  priority: Joi.string()
    .valid("low", "medium", "high", "urgent"),

  status: Joi.string()
    .valid("todo", "in_progress", "completed", "cancelled"),
}).min(1);

// ======================================================
// 4. VALIDATION CHO MỤC TIÊU HỌC TẬP
// ======================================================

const studyGoalParamsSchema = Joi.object({
  studentId: objectIdSchema,
  studyPlanId: objectIdSchema,
  goalId: objectIdSchema,
});

// Kiểm tra dữ liệu tạo mục tiêu
const createStudyGoalSchema = Joi.object({
  goalName: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  description: Joi.string()
    .trim()
    .allow("")
    .max(2000)
    .optional(),

  goalType: Joi.string()
    .valid("gpa", "credits")
    .required(),

  targetValue: Joi.number()
    .min(0)
    .when("goalType", {
      is: "gpa",
      then: Joi.number().max(4),
    })
    .required(),

  currentValue: Joi.number()
    .min(0)
    .when("goalType", {
      is: "gpa",
      then: Joi.number().max(4),
    })
    .default(0),

  startDate: Joi.date()
    .iso()
    .required(),

  endDate: Joi.date()
    .iso()
    .greater(Joi.ref("startDate"))
    .required(),
});

// Kiểm tra dữ liệu cập nhật mục tiêu
const updateStudyGoalSchema = Joi.object({
  goalName: Joi.string()
    .trim()
    .min(2)
    .max(200),

  description: Joi.string()
    .trim()
    .allow("")
    .max(2000),

  targetValue: Joi.number()
    .min(0)
    .max(4),

  currentValue: Joi.number()
    .min(0)
    .max(4),

  startDate: Joi.date().iso(),

  endDate: Joi.date().iso(),

  status: Joi.string()
    .valid("active", "completed", "failed", "cancelled"),
}).min(1);

// ======================================================
// EXPORT VALIDATION
// ======================================================

module.exports = {
  objectIdSchema,

  studentIdParamsSchema,
  studyPlanParamsSchema,
  createStudyPlanSchema,
  updateStudyPlanSchema,

  plannedCourseParamsSchema,
  addPlannedCourseSchema,
  updatePlannedCourseSchema,

  taskParamsSchema,
  createTaskSchema,
  updateTaskSchema,

  studyGoalParamsSchema,
  createStudyGoalSchema,
  updateStudyGoalSchema,
};
