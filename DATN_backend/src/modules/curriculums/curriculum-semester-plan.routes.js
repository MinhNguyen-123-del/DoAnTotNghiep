
const express = require("express");
const router = express.Router();

const controller = require(
    "./curriculum-semester-plan.controller"
);

// Đổi đường dẫn này nếu middleware auth của
// dự án đang nằm ở vị trí khác.
const authenticate = require(
    "../../middlewares/auth.middleware"
);

const { authorize } = require(
    "../../middlewares/role.middleware"
);

// Chỉ Admin được thêm hoặc sửa kế hoạch
router.put(
    "/",
    authenticate,
    authorize("admin"),
    controller.saveSemesterPlan
);

// Admin xem kế hoạch tín chỉ
router.get(
    "/:curriculumVersionId",
    authenticate,
    authorize("admin"),
    controller.getSemesterPlans
);

module.exports = router;
