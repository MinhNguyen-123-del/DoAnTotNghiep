
const mongoose = require("mongoose");

// Model quản lý mục tiêu học tập của sinh viên
const studyGoalSchema = new mongoose.Schema(
  {
    // Sinh viên sở hữu mục tiêu
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: [true, "Sinh viên không được để trống"],
    },

    // Kế hoạch học tập liên quan
    studyPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPlan",
      required: [true, "Kế hoạch học tập không được để trống"],
    },

    // Tên mục tiêu học tập
    goalName: {
      type: String,
      required: [true, "Tên mục tiêu không được để trống"],
      trim: true,
      maxlength: [200, "Tên mục tiêu không được vượt quá 200 ký tự"],
    },

    // Mô tả chi tiết mục tiêu
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Mô tả không được vượt quá 2000 ký tự"],
    },

    // Loại mục tiêu
    goalType: {
      type: String,
      enum: {
        values: ["gpa", "credits"],
        message: "Loại mục tiêu không hợp lệ",
      },
      required: [true, "Loại mục tiêu không được để trống"],
    },

    // Giá trị mục tiêu GPA hoặc số tín chỉ
    targetValue: {
      type: Number,
      required: [true, "Giá trị mục tiêu không được để trống"],
      min: [0, "Giá trị mục tiêu không được nhỏ hơn 0"],
      validate: {
        validator: Number.isFinite,
        message: "Giá trị mục tiêu phải là số hợp lệ",
      },
    },

    // Giá trị hiện tại của mục tiêu
    currentValue: {
      type: Number,
      default: 0,
      min: [0, "Giá trị hiện tại không được nhỏ hơn 0"],
      validate: {
        validator: Number.isFinite,
        message: "Giá trị hiện tại phải là số hợp lệ",
      },
    },

    // Ngày bắt đầu thực hiện mục tiêu
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu không được để trống"],
    },

    // Hạn hoàn thành mục tiêu
    endDate: {
      type: Date,
      required: [true, "Ngày kết thúc không được để trống"],
    },

    // Trạng thái mục tiêu
    status: {
      type: String,
      enum: {
        values: ["active", "completed", "failed", "cancelled"],
        message: "Trạng thái mục tiêu không hợp lệ",
      },
      default: "active",
    },

    // Thời điểm hoàn thành mục tiêu
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

// Kiểm tra ngày kết thúc phải sau ngày bắt đầu
studyGoalSchema.pre("validate", function () {
  if (
    this.startDate &&
    this.endDate &&
    this.endDate <= this.startDate
  ) {
    this.invalidate(
      "endDate",
      "Ngày kết thúc phải sau ngày bắt đầu"
    );
  }

  // GPA mục tiêu không được vượt quá thang điểm 4
  if (this.goalType === "gpa" && this.targetValue > 4) {
    this.invalidate(
      "targetValue",
      "GPA mục tiêu không được vượt quá thang điểm 4"
    );
  }

  // GPA hiện tại không được vượt quá thang điểm 4
  if (this.goalType === "gpa" && this.currentValue > 4) {
    this.invalidate(
      "currentValue",
      "GPA hiện tại không được vượt quá thang điểm 4"
    );
  }

  // Ghi nhận thời điểm hoàn thành mục tiêu
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }
});

// Tìm mục tiêu theo sinh viên và kế hoạch học tập
studyGoalSchema.index({ student: 1, studyPlan: 1 });

// Tìm mục tiêu theo trạng thái
studyGoalSchema.index({ student: 1, status: 1 });

// Tìm mục tiêu theo loại
studyGoalSchema.index({ goalType: 1 });

// Tạo Model
const StudyGoal = mongoose.model("StudyGoal", studyGoalSchema);

module.exports = StudyGoal;
