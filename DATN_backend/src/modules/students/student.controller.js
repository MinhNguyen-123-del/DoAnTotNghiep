
const studentService = require("./student.service");

// API tạo hồ sơ sinh viên
const createStudent = async (req, res) => {
    try {
        const student = await studentService.createStudent(req.body);

        return res.status(201).json({
            success: true,
            message: "Tạo hồ sơ sinh viên thành công",
            data: student
        });

    } catch (error) {
        console.error("Create student error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Tài khoản hoặc mã sinh viên đã tồn tại"
            });
        }

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createStudent
};
