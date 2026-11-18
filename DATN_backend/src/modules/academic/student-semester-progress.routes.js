const express = require("express");

const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const controller = require(
    "./student-semester-progress.controller"
);

const router = express.Router();

// Chi admin quan ly tien do hoc ky cua sinh vien.
router.use(authenticate);
router.use(authorize("admin"));

// PUT /api/academic/student-semester-progresses
router.put("/", controller.saveStudentSemesterProgress);

// GET /api/academic/student-semester-progresses/students/:studentId
router.get(
    "/students/:studentId",
    controller.getStudentSemesterProgresses
);

module.exports = router;
