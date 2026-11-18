
const mongoose = require("mongoose");

// Model quản lý công việc và thời hạn học tập của sinh viên
const taskSchema = new mongoose.Schema(
  {
    // Sinh viên sở hữu công việc
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: [true, "Sinh viên không được để trống"],
    },

    // Kế hoạch học tập chứa công việc
    studyPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPlan",
      required: [true, "Kế hoạch học tập không được để trống"],
    },

    // Môn học liên quan (không bắt buộc)
    plannedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlannedCourse",
      default: null,
    },

    // Tiêu đề công việc
    title: {
      type: String,
      required: [true, "Tên công việc không được để trống"],
      trim: true,
      maxlength: [200, "Tên công việc không được vượt quá 200 ký tự"],
    },

    // Mô tả chi tiết công việc
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Mô tả không được vượt quá 2000 ký tự"],
    },

    // Thời hạn hoàn thành
    dueDate: {
      type: Date,
      required: [true, "Thời hạn hoàn thành không được để trống"],
    },

    // Mức độ ưu tiên
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "Mức độ ưu tiên không hợp lệ",
      },
      default: "medium",
    },

    // Trạng thái công việc
    status: {
      type: String,
      enum: {
        values: ["todo", "in_progress", "completed", "cancelled"],
        message: "Trạng thái công việc không hợp lệ",
      },
      default: "todo",
    },

    // Thời điểm hoàn thành công việc
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Tự động ghi nhận thời điểm khi công việc chuyển sang hoàn thành
taskSchema.pre("validate", function () {
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }
});

// Tìm công việc của sinh viên theo hạn hoàn thành
taskSchema.index({ student: 1, dueDate: 1 });

// Tìm công việc theo kế hoạch và trạng thái
taskSchema.index({ studyPlan: 1, status: 1 });

// Tìm công việc liên quan đến môn học
taskSchema.index({ plannedCourse: 1 });

// Tạo Model
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
