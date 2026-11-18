
const mongoose = require("mongoose");

const StudyPlan = require("./models/study-plan.model");
const PlannedCourse = require("./models/planned-course.model");
const ScheduleEvent = require("./models/schedule-event.model");
const Task = require("./models/task.model");
const StudyGoal = require("./models/study-goal.model");

const StudentProfile = require("../students/student-profile.model");
const Semester = require("../academic/models/semester.model");
const Subject = require("../academic/models/subject.model");
const AcademicRecord = require("../academic/models/academic-record.model");
const CurriculumSubject = require("../curriculums/curriculum-subject.model");

// ======================================================
// HÀM HỖ TRỢ
// ======================================================

// Tạo lỗi nghiệp vụ có mã HTTP
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Kiểm tra ObjectId hợp lệ
const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(`${fieldName} không hợp lệ`);
  }
};

// Lấy hồ sơ sinh viên
const getStudent = async (studentId) => {
  validateObjectId(studentId, "Student ID");

  const student = await StudentProfile.findById(studentId);

  if (!student) {
    throw createError("Không tìm thấy hồ sơ sinh viên", 404);
  }

  return student;
};

// Lấy kế hoạch học tập và kiểm tra quyền sở hữu
const getStudentPlan = async (studentId, studyPlanId) => {
  validateObjectId(studyPlanId, "Study Plan ID");

  const plan = await StudyPlan.findOne({
    _id: studyPlanId,
    student: studentId,
  });

  if (!plan) {
    throw createError("Không tìm thấy kế hoạch học tập", 404);
  }

  return plan;
};

// ======================================================
// 1. QUẢN LÝ KẾ HOẠCH HỌC TẬP
// ======================================================

// Tạo kế hoạch học tập
const createStudyPlan = async (data) => {
  const {
    studentId,
    semesterId,
    planName,
    description = "",
  } = data;

  const student = await getStudent(studentId);

  validateObjectId(semesterId, "Semester ID");

  const semester = await Semester.findById(semesterId);

  if (!semester) {
    throw createError("Không tìm thấy học kỳ", 404);
  }

  if (!student.curriculum) {
    throw createError("Sinh viên chưa được gán chương trình đào tạo");
  }

  // Mỗi sinh viên chỉ có một kế hoạch cho một học kỳ
  const existingPlan = await StudyPlan.findOne({
    student: studentId,
    semester: semesterId,
  });

  if (existingPlan) {
    throw createError(
      "Sinh viên đã có kế hoạch học tập trong học kỳ này",
      409
    );
  }

  const plan = await StudyPlan.create({
    student: studentId,
    semester: semesterId,
    planName,
    description,
    status: "draft",
    totalPlannedCredits: 0,
  });

  return plan;
};

// Lấy danh sách kế hoạch của sinh viên
const getStudyPlans = async (studentId) => {
  await getStudent(studentId);

  return StudyPlan.find({ student: studentId })
    .populate("semester")
    .sort({ createdAt: -1 });
};

// Lấy chi tiết kế hoạch
const getStudyPlanDetail = async (studentId, studyPlanId) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  const [courses, events, tasks, goals] = await Promise.all([
    PlannedCourse.find({ studyPlan: plan._id })
      .populate("subject"),

    ScheduleEvent.find({ studyPlan: plan._id })
      .sort({ startTime: 1 }),

    Task.find({ studyPlan: plan._id })
      .sort({ dueDate: 1 }),

    StudyGoal.find({ studyPlan: plan._id })
      .sort({ createdAt: -1 }),
  ]);

  return {
    plan,
    courses,
    events,
    tasks,
    goals,
  };
};

// Cập nhật thông tin kế hoạch
const updateStudyPlan = async (studentId, studyPlanId, data) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  if (plan.status === "completed" || plan.status === "cancelled") {
    throw createError("Không thể sửa kế hoạch đã hoàn thành hoặc đã hủy");
  }

  const allowedFields = ["planName", "description", "status"];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      plan[field] = data[field];
    }
  });

  await plan.save();

  return plan;
};

// Xóa kế hoạch học tập
const deleteStudyPlan = async (studentId, studyPlanId) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  // Chỉ xóa kế hoạch nháp và chưa có dữ liệu liên quan
  if (plan.status !== "draft") {
    throw createError("Chỉ được xóa kế hoạch ở trạng thái nháp");
  }

  const [courseCount, eventCount, taskCount, goalCount] =
    await Promise.all([
      PlannedCourse.countDocuments({ studyPlan: plan._id }),
      ScheduleEvent.countDocuments({ studyPlan: plan._id }),
      Task.countDocuments({ studyPlan: plan._id }),
      StudyGoal.countDocuments({ studyPlan: plan._id }),
    ]);

  if (courseCount || eventCount || taskCount || goalCount) {
    throw createError(
      "Kế hoạch đã có dữ liệu liên quan. Hãy xóa dữ liệu liên quan trước."
    );
  }

  await plan.deleteOne();

  return { message: "Xóa kế hoạch học tập thành công" };
};

// ======================================================
// 2. QUẢN LÝ MÔN HỌC DỰ KIẾN
// ======================================================

// Tính lại tổng tín chỉ dự kiến
const recalculatePlannedCredits = async (studyPlanId) => {
  const result = await PlannedCourse.aggregate([
    {
      $match: {
        studyPlan: new mongoose.Types.ObjectId(studyPlanId),
        status: { $in: ["planned", "approved"] },
      },
    },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: "$creditsSnapshot" },
      },
    },
  ]);

  const totalCredits =
    result.length > 0 ? result[0].totalCredits : 0;

  await StudyPlan.findByIdAndUpdate(studyPlanId, {
    $set: { totalPlannedCredits: totalCredits },
    $inc: { __v: 1 },
  });

  return totalCredits;
};

// Kiểm tra môn tiên quyết đã được hoàn thành chưa
const checkPrerequisites = async (studentId, subjectId, curriculumId) => {
  const curriculumSubject = await CurriculumSubject.findOne({
    curriculum: curriculumId,
    subject: subjectId,
  }).populate("prerequisites");

  if (!curriculumSubject) {
    throw createError(
      "Môn học không thuộc chương trình đào tạo của sinh viên"
    );
  }

  const prerequisiteIds = curriculumSubject.prerequisites || [];

  if (prerequisiteIds.length === 0) {
    return {
      valid: true,
      missingPrerequisites: [],
    };
  }

  // Lấy kết quả học tập đã được xác nhận
  const records = await AcademicRecord.find({
    student: studentId,
    subject: { $in: prerequisiteIds.map((item) => item._id) },
    status: "confirmed",
  }).sort({
    attemptNumber: -1,
    confirmedAt: -1,
    createdAt: -1,
  });

  // Chọn lần học mới nhất của từng môn
  const latestRecords = new Map();

  for (const record of records) {
    const subjectIdString = record.subject.toString();

    if (!latestRecords.has(subjectIdString)) {
      latestRecords.set(subjectIdString, record);
    }
  }

  const missingPrerequisites = prerequisiteIds.filter((item) => {
    const latestRecord = latestRecords.get(item._id.toString());

    return !latestRecord || latestRecord.isPassed !== true;
  });

  return {
    valid: missingPrerequisites.length === 0,
    missingPrerequisites: missingPrerequisites.map((item) => ({
      _id: item._id,
      subjectName: item.subjectName,
    })),
  };
};

// Thêm môn học vào kế hoạch
const addPlannedCourse = async (studentId, studyPlanId, data) => {
  const { subject: subjectId, note = "" } = data;

  const student = await getStudent(studentId);
  const plan = await getStudentPlan(studentId, studyPlanId);

  if (plan.status === "completed" || plan.status === "cancelled") {
    throw createError("Không thể thêm môn vào kế hoạch đã kết thúc");
  }

  validateObjectId(subjectId, "Subject ID");

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw createError("Không tìm thấy môn học", 404);
  }

  if (!student.curriculum) {
    throw createError("Sinh viên chưa được gán chương trình đào tạo");
  }

  // Kiểm tra môn học có trong chương trình đào tạo
  const curriculumSubject = await CurriculumSubject.findOne({
    curriculum: student.curriculum,
    subject: subject._id,
  });

  if (!curriculumSubject) {
    throw createError(
      "Môn học không thuộc chương trình đào tạo của sinh viên"
    );
  }

  // Kiểm tra môn học đã có trong kế hoạch chưa
  const existingCourse = await PlannedCourse.findOne({
    studyPlan: plan._id,
    subject: subject._id,
  });

  if (existingCourse) {
    throw createError(
      "Môn học đã tồn tại trong kế hoạch này",
      409
    );
  }

  // Kiểm tra môn tiên quyết
  const prerequisiteResult = await checkPrerequisites(
    studentId,
    subject._id,
    student.curriculum
  );

  if (!prerequisiteResult.valid) {
    const names = prerequisiteResult.missingPrerequisites
      .map((item) => item.subjectName)
      .join(", ");

    throw createError(
      `Chưa hoàn thành môn tiên quyết: ${names}`
    );
  }

  // Giới hạn tín chỉ chưa được áp dụng do chưa có quy định chính thức
  const plannedCourse = await PlannedCourse.create({
    studyPlan: plan._id,
    subject: subject._id,
    creditsSnapshot: subject.credits,
    status: "planned",
    rejectionReason: "",
    note,
  });

  const totalPlannedCredits = await recalculatePlannedCredits(
    plan._id
  );

  return {
    plannedCourse,
    totalPlannedCredits,
  };
};

// Lấy danh sách môn học dự kiến
const getPlannedCourses = async (studentId, studyPlanId) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  return PlannedCourse.find({ studyPlan: plan._id })
    .populate("subject")
    .sort({ createdAt: 1 });
};

// Cập nhật trạng thái môn học dự kiến
const updatePlannedCourse = async (
  studentId,
  studyPlanId,
  plannedCourseId,
  data
) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  validateObjectId(plannedCourseId, "Planned Course ID");

  const course = await PlannedCourse.findOne({
    _id: plannedCourseId,
    studyPlan: plan._id,
  });

  if (!course) {
    throw createError("Không tìm thấy môn học dự kiến", 404);
  }

  const allowedStatuses = ["planned", "approved", "rejected", "cancelled"];

  if (!allowedStatuses.includes(data.status)) {
    throw createError("Trạng thái môn học không hợp lệ");
  }

  if (data.status === "rejected" && !data.rejectionReason?.trim()) {
    throw createError("Vui lòng nhập lý do từ chối môn học");
  }

  course.status = data.status;
  course.rejectionReason =
    data.status === "rejected" ? data.rejectionReason.trim() : "";

  if (data.note !== undefined) {
    course.note = data.note;
  }

  await course.save();

  const totalPlannedCredits = await recalculatePlannedCredits(
    plan._id
  );

  return {
    plannedCourse: course,
    totalPlannedCredits,
  };
};

// Xóa môn học dự kiến
const removePlannedCourse = async (
  studentId,
  studyPlanId,
  plannedCourseId
) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  validateObjectId(plannedCourseId, "Planned Course ID");

  const course = await PlannedCourse.findOne({
    _id: plannedCourseId,
    studyPlan: plan._id,
  });

  if (!course) {
    throw createError("Không tìm thấy môn học dự kiến", 404);
  }

  // Không xóa cứng để giữ lại lịch sử; chuyển sang cancelled
  course.status = "cancelled";
  await course.save();

  const totalPlannedCredits = await recalculatePlannedCredits(
    plan._id
  );

  return {
    message: "Đã hủy môn học khỏi kế hoạch",
    totalPlannedCredits,
  };
};

// ======================================================
// 3. KIỂM TRA TRÙNG LỊCH
// ======================================================

// Hai sự kiện bị trùng nếu khoảng thời gian giao nhau
const checkScheduleConflict = async (
  studentId,
  startTime,
  endTime,
  excludeEventId = null
) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw createError("Thời gian sự kiện không hợp lệ");
  }

  const query = {
    student: studentId,
    status: "scheduled",
    startTime: { $lt: end },
    endTime: { $gt: start },
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  const conflict = await ScheduleEvent.findOne(query);

  return {
    hasConflict: Boolean(conflict),
    conflictingEvent: conflict,
  };
};

// ======================================================
// 4. QUẢN LÝ CÔNG VIỆC
// ======================================================

const createTask = async (studentId, studyPlanId, data) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  if (data.plannedCourse) {
    const course = await PlannedCourse.findOne({
      _id: data.plannedCourse,
      studyPlan: plan._id,
    });

    if (!course) {
      throw createError(
        "Môn học dự kiến không thuộc kế hoạch này"
      );
    }
  }

  return Task.create({
    student: studentId,
    studyPlan: plan._id,
    plannedCourse: data.plannedCourse || null,
    title: data.title,
    description: data.description || "",
    dueDate: data.dueDate,
    priority: data.priority || "medium",
    status: "todo",
  });
};

const getTasks = async (studentId, studyPlanId) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  const tasks = await Task.find({
    student: studentId,
    studyPlan: plan._id,
  })
    .populate("plannedCourse")
    .sort({ dueDate: 1 });

  const now = new Date();

  return tasks.map((task) => {
    const taskObject = task.toObject();

    taskObject.isOverdue =
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      task.dueDate < now;

    return taskObject;
  });
};

const updateTask = async (
  studentId,
  studyPlanId,
  taskId,
  data
) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  validateObjectId(taskId, "Task ID");

  const task = await Task.findOne({
    _id: taskId,
    student: studentId,
    studyPlan: plan._id,
  });

  if (!task) {
    throw createError("Không tìm thấy công việc", 404);
  }

  const allowedFields = [
    "title",
    "description",
    "dueDate",
    "priority",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      task[field] = data[field];
    }
  });

  await task.save();

  return task;
};

const deleteTask = async (studentId, studyPlanId, taskId) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  validateObjectId(taskId, "Task ID");

  const task = await Task.findOneAndDelete({
    _id: taskId,
    student: studentId,
    studyPlan: plan._id,
  });

  if (!task) {
    throw createError("Không tìm thấy công việc", 404);
  }

  return { message: "Xóa công việc thành công" };
};

// ======================================================
// 5. QUẢN LÝ MỤC TIÊU HỌC TẬP
// ======================================================

const createStudyGoal = async (studentId, studyPlanId, data) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  return StudyGoal.create({
    student: studentId,
    studyPlan: plan._id,
    goalName: data.goalName,
    description: data.description || "",
    goalType: data.goalType,
    targetValue: data.targetValue,
    currentValue: data.currentValue ?? 0,
    startDate: data.startDate,
    endDate: data.endDate,
    status: "active",
  });
};

const getStudyGoals = async (studentId, studyPlanId) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  return StudyGoal.find({
    student: studentId,
    studyPlan: plan._id,
  }).sort({ createdAt: -1 });
};

const updateStudyGoal = async (
  studentId,
  studyPlanId,
  goalId,
  data
) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  validateObjectId(goalId, "Goal ID");

  const goal = await StudyGoal.findOne({
    _id: goalId,
    student: studentId,
    studyPlan: plan._id,
  });

  if (!goal) {
    throw createError("Không tìm thấy mục tiêu học tập", 404);
  }

  const allowedFields = [
    "goalName",
    "description",
    "targetValue",
    "currentValue",
    "startDate",
    "endDate",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      goal[field] = data[field];
    }
  });

  await goal.save();

  return goal;
};

const deleteStudyGoal = async (studentId, studyPlanId, goalId) => {
  const plan = await getStudentPlan(studentId, studyPlanId);

  validateObjectId(goalId, "Goal ID");

  const goal = await StudyGoal.findOneAndDelete({
    _id: goalId,
    student: studentId,
    studyPlan: plan._id,
  });

  if (!goal) {
    throw createError("Không tìm thấy mục tiêu học tập", 404);
  }

  return { message: "Xóa mục tiêu học tập thành công" };
};

// ======================================================
// EXPORT SERVICE
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
  recalculatePlannedCredits,
  checkPrerequisites,

  checkScheduleConflict,

  createTask,
  getTasks,
  updateTask,
  deleteTask,

  createStudyGoal,
  getStudyGoals,
  updateStudyGoal,
  deleteStudyGoal,
};
