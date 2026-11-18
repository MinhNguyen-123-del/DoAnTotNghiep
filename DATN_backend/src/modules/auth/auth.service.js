const User = require("../users/user.model");
const {
    generateAccessToken
} = require("../../utils/jwt");

// =====================================================
// 1. ĐĂNG KÝ
// =====================================================

const signup = async (data) => {
    const { email, password } = data;

    if (!email || !password) {
        throw new Error("Email và mật khẩu là bắt buộc");
    }

    if (password.length < 8) {
        throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new Error("Email đã được sử dụng");
    }

    // Đăng ký công khai luôn là sinh viên
    const user = await User.create({
        email: normalizedEmail,
        password,
        role: "student",
        status: "active",
        isVerified: false
    });

    return {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status
    };
};

// =====================================================
// 2. ĐĂNG NHẬP
// =====================================================

const signin = async (data) => {
    const { email, password } = data;

    if (!email || !password) {
        throw new Error("Email và mật khẩu là bắt buộc");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
        throw new Error("Email hoặc mật khẩu không chính xác");
    }

    if (user.status !== "active") {
        throw new Error("Tài khoản hiện không thể đăng nhập");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new Error("Email hoặc mật khẩu không chính xác");
    }

    // Cập nhật lần đăng nhập gần nhất
    user.lastLogin = new Date();

    await user.save();

    const accessToken = generateAccessToken(user);

    return {
        accessToken,
        tokenType: "Bearer",
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            isVerified: user.isVerified
        }
    };
};

// =====================================================
// 3. LẤY THÔNG TIN TÀI KHOẢN
// =====================================================

const getMe = async (userId) => {
    const user = await User.findById(userId)
        .select("-password")
        .lean();

    if (!user) {
        throw new Error("Không tìm thấy tài khoản");
    }

    return user;
};

// =====================================================
// 4. EXPORT
// =====================================================

module.exports = {
    signup,
    signin,
    getMe
};