
require("dotenv").config();

const connectDB = require("../config/database");
const User = require("../modules/users/user.model");

const resetStudentPassword = async () => {
    try {
        await connectDB();

        const student = await User.findOne({
            email: "nguyenvanan.test@gmail.com"
        }).select("+password");

        if (!student) {
            throw new Error("Không tìm thấy tài khoản Student.");
        }

        student.password = "Student@123456";
        student.role = "student";
        student.status = "active";

        await student.save();

        console.log("ĐÃ ĐỔI MẬT KHẨU STUDENT THÀNH CÔNG");
        console.log("Email:", student.email);
        console.log("Role:", student.role);

        process.exit(0);
    } catch (error) {
        console.error("Lỗi:", error.message);
        process.exit(1);
    }
};

resetStudentPassword();
