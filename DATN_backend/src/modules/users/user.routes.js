
const express = require("express");

// Khởi tạo Router cho phân hệ người dùng
const router = express.Router();

// Import Controller quản lý tài khoản người dùng
const userController = require("./user.controller");

// API kiểm tra Router Users
router.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Users API is running"
    });
});

// Xuất Router để app.js sử dụng
module.exports = router;
