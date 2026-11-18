
const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const authenticate = require("../../middlewares/auth.middleware");

// Đăng ký
router.post("/signup", authController.signup);

// Đăng nhập
router.post("/signin", authController.signin);

// Lấy thông tin tài khoản hiện tại
router.get("/me", authenticate, authController.getMe);

module.exports = router;
