
require("dotenv").config();

const connectDB = require("../config/database");
const User = require("../modules/users/models/user.model");

const createAdmin = async () => {
    try {
        await connectDB();

        const email = "admin@datn.com";
        const password = "Admin@123456";

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            console.log("Tài khoản Admin đã tồn tại.");
            process.exit(0);
        }

        const admin = await User.create({
            email,
            password,
            role: "admin",
            status: "active",
            isVerified: true
        });

        console.log("Tạo Admin thành công!");
        console.log({
            id: admin._id,
            email: admin.email,
            role: admin.role
        });

        process.exit(0);
    } catch (error) {
        console.error("Lỗi tạo Admin:", error.message);
        process.exit(1);
    }
};

createAdmin();
