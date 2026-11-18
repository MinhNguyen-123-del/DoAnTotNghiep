
const authService = require("./auth.service");

// Đăng ký tài khoản
const signup = async (req, res, next) => {
    try {
        const result = await authService.signup(req.body);

        return res.status(201).json({
            success: true,
            message: "Đăng ký tài khoản thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Đăng nhập
const signin = async (req, res, next) => {
    try {
        const result = await authService.signin(req.body);

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Lấy thông tin tài khoản hiện tại
const getMe = async (req, res, next) => {
    try {
        const result = await authService.getMe(req.user.userId);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    signin,
    getMe
};
