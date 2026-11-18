
const StudyPlan = require("../modules/study-plans/models/study-plan.model");
const PlannedCourse = require("../modules/study-plans/models/planned-course.model");
const ScheduleEvent = require("../modules/study-plans/models/schedule-event.model");
const Task = require("../modules/study-plans/models/task.model");
const StudyGoal = require("../modules/study-plans/models/study-goal.model");

// Danh sách các Model cần kiểm tra
const models = [
  { name: "StudyPlan", model: StudyPlan },
  { name: "PlannedCourse", model: PlannedCourse },
  { name: "ScheduleEvent", model: ScheduleEvent },
  { name: "Task", model: Task },
  { name: "StudyGoal", model: StudyGoal },
];

// Kiểm tra Model đã được khai báo và có Schema
console.log("\n===== KIỂM TRA STUDY PLANS MODELS =====");

let hasError = false;

models.forEach(({ name, model }) => {
  if (model && model.schema) {
    console.log(`✅ ${name}: Import thành công`);
    console.log(`   Collection: ${model.collection.name}`);
    console.log(`   Fields: ${Object.keys(model.schema.paths).length}`);
  } else {
    hasError = true;
    console.log(`❌ ${name}: Không tìm thấy Schema`);
  }
});

if (hasError) {
  console.log("\nCó Model chưa hợp lệ. Hãy kiểm tra lại các file.");
  process.exitCode = 1;
} else {
  console.log("\n🎉 Cả 5 Model đã import thành công!");
}
