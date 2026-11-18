
const express = require("express");

const router = express.Router();

const chatController = require("./chat.controller");

const {
    validateChatRequest,
    validateConversationParam,
    validatePaginationRequest
} = require("./chat.validation");

// =====================================================
// BẢO VỆ ROUTE
// =====================================================

// Middleware xác thực JWT của dự án phải chạy trước router này.
// Middleware dưới đây chỉ kiểm tra req.user đã được xác thực.
const requireAuthenticatedUser = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Vui lòng đăng nhập để sử dụng chức năng này"
        });
    }

    next();
};

router.use(requireAuthenticatedUser);

// =====================================================
// 1. GỬI TIN NHẮN
// POST /api/chat
// =====================================================

router.post(
    "/",
    validateChatRequest,
    chatController.sendMessage
);

// =====================================================
// 2. LẤY DANH SÁCH HỘI THOẠI
// GET /api/chat
// =====================================================

router.get(
    "/",
    validatePaginationRequest,
    chatController.getConversations
);

// =====================================================
// 3. LẤY CHI TIẾT HỘI THOẠI
// GET /api/chat/:conversationId
// =====================================================

router.get(
    "/:conversationId",
    validateConversationParam,
    validatePaginationRequest,
    chatController.getConversationDetail
);

// =====================================================
// 4. CẬP NHẬT TRẠNG THÁI HỘI THOẠI
// PATCH /api/chat/:conversationId/status
// =====================================================

router.patch(
    "/:conversationId/status",
    validateConversationParam,
    chatController.updateConversationStatus
);

// =====================================================
// 5. XÓA HỘI THOẠI
// DELETE /api/chat/:conversationId
// =====================================================

router.delete(
    "/:conversationId",
    validateConversationParam,
    chatController.deleteConversation
);

module.exports = router;
