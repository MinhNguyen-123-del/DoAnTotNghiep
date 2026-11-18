
const mongoose = require("mongoose");

// =====================================================
// 1. HÀM HỖ TRỢ
// =====================================================

// Tạo lỗi validation
const createValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

// Kiểm tra ObjectId hợp lệ
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id) &&
        new mongoose.Types.ObjectId(id).toString() === id;
};

// =====================================================
// 2. KIỂM TRA CÂU HỎI
// =====================================================

const validateQuestion = (question) => {
    if (
        typeof question !== "string" ||
        !question.trim()
    ) {
        throw createValidationError(
            "Câu hỏi không được để trống"
        );
    }

    const normalizedQuestion = question.trim();

    if (normalizedQuestion.length < 2) {
        throw createValidationError(
            "Câu hỏi phải có ít nhất 2 ký tự"
        );
    }

    if (normalizedQuestion.length > 4000) {
        throw createValidationError(
            "Câu hỏi không được vượt quá 4000 ký tự"
        );
    }

    return normalizedQuestion;
};

// =====================================================
// 3. KIỂM TRA CONVERSATION ID
// =====================================================

const validateConversationId = (conversationId) => {
    // Không truyền ID nghĩa là tạo cuộc hội thoại mới
    if (
        conversationId === undefined ||
        conversationId === null ||
        conversationId === ""
    ) {
        return null;
    }

    if (
        typeof conversationId !== "string" ||
        !isValidObjectId(conversationId)
    ) {
        throw createValidationError(
            "Conversation ID không hợp lệ"
        );
    }

    return conversationId;
};

// =====================================================
// 4. KIỂM TRA DỮ LIỆU GỬI TIN NHẮN
// =====================================================

const validateSendMessage = (data) => {
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw createValidationError(
            "Dữ liệu gửi lên không hợp lệ"
        );
    }

    const question = validateQuestion(data.question);

    const conversationId = validateConversationId(
        data.conversationId
    );

    return {
        question,
        conversationId
    };
};

// =====================================================
// 5. MIDDLEWARE KIỂM TRA TIN NHẮN
// =====================================================

const validateChatRequest = (req, res, next) => {
    try {
        const validatedData = validateSendMessage(req.body);

        // Chỉ sử dụng dữ liệu đã được kiểm tra
        req.validatedChat = validatedData;

        next();
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// 6. MIDDLEWARE KIỂM TRA CONVERSATION ID TRÊN PARAMS
// =====================================================

const validateConversationParam = (req, res, next) => {
    try {
        const conversationId = validateConversationId(
            req.params.conversationId
        );

        if (!conversationId) {
            throw createValidationError(
                "Conversation ID là bắt buộc"
            );
        }

        req.validatedConversationId = conversationId;

        next();
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// 7. KIỂM TRA PHÂN TRANG
// =====================================================

const validatePagination = (data = {}) => {
    const page = Number(data.page ?? 1);
    const limit = Number(data.limit ?? 20);

    if (
        !Number.isInteger(page) ||
        page < 1
    ) {
        throw createValidationError(
            "Page phải là số nguyên lớn hơn 0"
        );
    }

    if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw createValidationError(
            "Limit phải nằm trong khoảng từ 1 đến 100"
        );
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

// =====================================================
// 8. MIDDLEWARE KIỂM TRA PHÂN TRANG
// =====================================================

const validatePaginationRequest = (req, res, next) => {
    try {
        req.validatedPagination = validatePagination(
            req.query
        );

        next();
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// 9. EXPORT
// =====================================================

module.exports = {
    validateQuestion,
    validateConversationId,
    validateSendMessage,
    validateChatRequest,
    validateConversationParam,
    validatePagination,
    validatePaginationRequest
};
