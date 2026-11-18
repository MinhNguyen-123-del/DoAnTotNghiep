
const StudentProfile = require("../students/student-profile.model");

const chatService = require("./chat.service");

const {
    validatePagination
} = require("./chat.validation");

// =====================================================
// 1. LẤY STUDENT PROFILE TỪ TÀI KHOẢN ĐĂNG NHẬP
// =====================================================

const getAuthenticatedStudent = async (req) => {
    // Yêu cầu JWT middleware phải gắn tài khoản vào req.user
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!userId) {
        const error = new Error("Vui lòng đăng nhập để sử dụng trợ lý AI");
        error.statusCode = 401;
        throw error;
    }

    const student = await StudentProfile.findOne({
        user: userId
    }).select("_id user studentCode fullName");

    if (!student) {
        const error = new Error("Không tìm thấy hồ sơ sinh viên");
        error.statusCode = 404;
        throw error;
    }

    return student;
};

// =====================================================
// 2. GỬI TIN NHẮN
// =====================================================

const sendMessage = async (req, res) => {
    try {
        const student = await getAuthenticatedStudent(req);

        const { question, conversationId } = req.validatedChat;

        const result = await chatService.sendMessage({
            studentId: student._id,
            question,
            conversationId
        });

        return res.status(200).json({
            success: true,
            message: "Gửi câu hỏi thành công",
            data: result
        });

    } catch (error) {
        console.error("SEND CHAT MESSAGE ERROR:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Không thể xử lý câu hỏi. Vui lòng thử lại."
        });
    }
};

// =====================================================
// 3. LẤY DANH SÁCH HỘI THOẠI
// =====================================================

const getConversations = async (req, res) => {
    try {
        const student = await getAuthenticatedStudent(req);
        const pagination = validatePagination(req.query);

        const result = await chatService.getConversations(
            student._id,
            pagination
        );

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách hội thoại thành công",
            data: result
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// 4. LẤY CHI TIẾT HỘI THOẠI
// =====================================================

const getConversationDetail = async (req, res) => {
    try {
        const student = await getAuthenticatedStudent(req);
        const pagination = validatePagination(req.query);

        const result = await chatService.getConversationDetail(
            student._id,
            req.validatedConversationId,
            pagination
        );

        return res.status(200).json({
            success: true,
            message: "Lấy chi tiết hội thoại thành công",
            data: result
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// 5. LƯU TRẠNG THÁI HỘI THOẠI
// =====================================================

const updateConversationStatus = async (req, res) => {
    try {
        const student = await getAuthenticatedStudent(req);
        const { status } = req.body;

        const result = await chatService.updateConversationStatus(
            student._id,
            req.validatedConversationId,
            status
        );

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái hội thoại thành công",
            data: result
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// 6. XÓA HỘI THOẠI
// =====================================================

const deleteConversation = async (req, res) => {
    try {
        const student = await getAuthenticatedStudent(req);

        const result = await chatService.deleteConversation(
            student._id,
            req.validatedConversationId
        );

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    sendMessage,
    getConversations,
    getConversationDetail,
    updateConversationStatus,
    deleteConversation
};
