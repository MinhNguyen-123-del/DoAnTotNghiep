
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/database");
const User = require("../modules/users/user.model");

const resetAdminPassword = async () => {
    try {
        console.log("1. Đang kết nối MongoDB...");

        await connectDB();

        console.log("2. Database:", mongoose.connection.name);

        const admin = await User.findOne({
            email: "admin@datn.com"
        });

        if (!admin) {
            throw new Error("Không tìm thấy admin@datn.com");
        }

        console.log("3. Đã tìm thấy Admin.");

        // Chủ động mã hóa mật khẩu bằng bcrypt
        const hashedPassword = await bcrypt.hash(
            "Admin@123456",
            12
        );

        // Cập nhật trực tiếp, không phụ thuộc pre-save
        const result = await User.updateOne(
            { _id: admin._id },
            {
                $set: {
                    password: hashedPassword,
                    role: "admin",
                    status: "active",
                    isVerified: true
                }
            }
        );

        console.log("4. Số bản ghi được cập nhật:", result.modifiedCount);

        // Đọc lại mật khẩu từ MongoDB
        const updatedAdmin = await User.findById(admin._id)
            .select("+password");

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(
            "Admin@123456",
            updatedAdmin.password
        );

        if (!isMatch) {
            throw new Error("Kiểm tra bcrypt thất bại!");
        }

        console.log("--------------------------------");
        console.log("RESET ADMIN THÀNH CÔNG!");
        console.log("Email:", updatedAdmin.email);
        console.log("Role:", updatedAdmin.role);
        console.log("Password:", updatedAdmin.password.substring(0, 7));
        console.log("Bcrypt verification:", isMatch);
        console.log("--------------------------------");

    } catch (error) {
        console.error("RESET ADMIN THẤT BẠI:", error);

    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

resetAdminPassword();
