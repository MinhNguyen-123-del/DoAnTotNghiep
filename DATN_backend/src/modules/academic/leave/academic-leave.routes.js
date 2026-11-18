const express = require("express");

const authenticate = require(
    "../../../middlewares/auth.middleware"
);

const { authorize } = require(
    "../../../middlewares/role.middleware"
);

const {
    createAcademicLeave,
    getStudentAcademicLeaves,
    cancelAcademicLeave
} = require("./academic-leave.controller");

const router = express.Router();

// Tat ca API bao luu chi danh cho admin.
router.use(authenticate);
router.use(authorize("admin"));

// POST /api/academic/leaves
router.post("/", createAcademicLeave);

// GET /api/academic/leaves/students/:studentId
router.get(
    "/students/:studentId",
    getStudentAcademicLeaves
);

// PATCH /api/academic/leaves/:leaveId/cancel
router.patch(
    "/:leaveId/cancel",
    cancelAcademicLeave
);

module.exports = router;
