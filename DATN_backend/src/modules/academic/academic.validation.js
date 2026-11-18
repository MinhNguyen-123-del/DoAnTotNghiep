
const Joi = require("joi");

// ==========================================
// 1. SCHEMA KIỂM TRA MONGODB OBJECTID
// ==========================================

// ObjectId hợp lệ phải gồm đúng 24 ký tự hệ thập lục phân
const objectIdSchema = Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
        "string.base": "ID phải là chuỗi ký tự",
        "string.empty": "ID không được để trống",
        "string.hex": "ID không đúng định dạng MongoDB ObjectId",
        "string.length": "ID phải có đúng 24 ký tự",
        "any.required": "Không được bỏ trống ID"
    });

// ==========================================
// 2. SCHEMA KIỂM TRA THAM SỐ URL
// ==========================================

// Kiểm tra studentId
// Sử dụng cho API summary, gpa, credits và progress
const studentIdParamsSchema = Joi.object({
    studentId: objectIdSchema
});

// Kiểm tra studentId và semesterId
// Sử dụng cho API kết quả học tập theo học kỳ
const semesterParamsSchema = Joi.object({
    studentId: objectIdSchema,
    semesterId: objectIdSchema
});

// Kiểm tra studentId và subjectId
// Sử dụng cho API lịch sử học lại
const subjectHistoryParamsSchema = Joi.object({
    studentId: objectIdSchema,
    subjectId: objectIdSchema
});

// ==========================================
// 3. MIDDLEWARE KIỂM TRA THAM SỐ URL
// ==========================================

const validateParams = (schema) => {
    return (req, res, next) => {

        // Kiểm tra các tham số URL theo Schema được truyền vào
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            allowUnknown: false,
            convert: false
        });

        // Nếu dữ liệu không hợp lệ thì trả về HTTP 400
        if (error) {

            // Tổng hợp danh sách lỗi chi tiết
            const errors = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: "Dữ liệu tham số không hợp lệ",
                errors
            });
        }

        // Gán dữ liệu đã được kiểm tra vào request
        req.params = value;

        // Chuyển sang Middleware hoặc Controller tiếp theo
        next();
    };
};

// ==========================================
// 4. XUẤT SCHEMA VÀ MIDDLEWARE
// ==========================================

module.exports = {
    studentIdParamsSchema,
    semesterParamsSchema,
    subjectHistoryParamsSchema,
    validateParams
};
