
const express = require("express");
const cors = require("cors");
const ENV = require("./config/environment");
const chatRoutes = require("./modules/chat/chat.routes");
const authRoutes = require("./modules/auth/auth.routes");
const knowledgeRoutes = require("./modules/chat/knowledge/knowledge.routes");
const analyticsRoutes = require(
    "./modules/analytics/analytics.routes"
);
// Khởi tạo ứng dụng Express
const app = express();

// Cho phép Frontend gửi request đến Backend
app.use(
    cors({
        origin: ENV.CLIENT_URL,
        credentials: true
    })
);
// Cho phép đọc dữ liệu JSON từ request
app.use(express.json());

// Cho phép đọc dữ liệu form
app.use(express.urlencoded({ extended: true }));

// Import Router của các phân hệ
const academicRoutes = require("./modules/academic/academic.routes");
const studentRoutes = require("./modules/students/student.routes");
const userRoutes = require("./modules/users/user.routes");
const curriculumRoutes = require("./modules/curriculums/curriculum.routes");
const academicLeaveRoutes = require(
    "./modules/academic/leave/academic-leave.routes"
);
const studentSemesterProgressRoutes = require(
    "./modules/academic/student-semester-progress.routes"
);
const curriculumSemesterPlanRoutes = require(
    "./modules/curriculums/curriculum-semester-plan.routes"
);
// Import Router quản lý kế hoạch học tập
const studyPlanRoutes = require("./modules/study-plans/study-plan.routes");
console.log("academicRoutes:", typeof academicRoutes);
console.log("studentRoutes:", typeof studentRoutes);
console.log("userRoutes:", typeof userRoutes);
console.log("curriculumRoutes:", typeof curriculumRoutes);
// API kiểm tra trạng thái hoạt động của Backend
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DATN Backend API is running"
    });
});

// Đăng ký Router cho từng phân hệ
app.use("/api/academic", academicRoutes);
app.use("/api/academic/leaves", academicLeaveRoutes);
app.use(
    "/api/academic/student-semester-progresses",
    studentSemesterProgressRoutes
);
app.use("/api/students", studentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/curriculums", curriculumRoutes);
app.use("/api/study-plans", studyPlanRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(
    "/api/curriculum-semester-plans",
    curriculumSemesterPlanRoutes
);
// Middleware xử lý API không tồn tại
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API không tồn tại"
    });
});

// Middleware xử lý lỗi tập trung
app.use((error, req, res, next) => {
    console.error("Server Error:", error);

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi máy chủ"
    });
});

// Xuất ứng dụng để server.js sử dụng
module.exports = app;
