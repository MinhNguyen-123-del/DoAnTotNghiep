
const express = require("express");
const router = express.Router();

const studentController = require("./student.controller");

// Kiểm tra API Students
router.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Students API is running"
    });
});

// Tạo hồ sơ sinh viên
router.post("/", studentController.createStudent);

module.exports = router;
