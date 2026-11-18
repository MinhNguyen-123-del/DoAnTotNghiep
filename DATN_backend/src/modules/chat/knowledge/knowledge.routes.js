
const express = require("express");

const {
    uploadKnowledgeFile
} = require("../../../middlewares/upload.middleware");

const {
    authenticate
} = require("../../../middlewares/auth.middleware");

const {
    authorize
} = require("../../../middlewares/role.middleware");

const {
    uploadKnowledgeDocument,
    getKnowledgeDocuments,
    getKnowledgeDocumentDetail,
    changeKnowledgeDocumentStatus,
    removeKnowledgeDocument
} = require("./knowledge.controller");

const router = express.Router();

// Tất cả API quản lý Knowledge Base yêu cầu đăng nhập Admin
router.use(authenticate, authorize("admin"));

// Upload tài liệu
router.post(
    "/upload",
    uploadKnowledgeFile,
    uploadKnowledgeDocument
);

// Lấy danh sách tài liệu
router.get(
    "/",
    getKnowledgeDocuments
);

// Lấy chi tiết tài liệu
router.get(
    "/:documentId",
    getKnowledgeDocumentDetail
);

// Cập nhật trạng thái tài liệu
router.patch(
    "/:documentId/status",
    changeKnowledgeDocumentStatus
);

// Xóa tài liệu
router.delete(
    "/:documentId",
    removeKnowledgeDocument
);

module.exports = router;
