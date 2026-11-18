
const fs = require("fs/promises");
const path = require("path");

const {
    parseDocument
} = require("./document-parser.service");

const {
    createDocument,
    saveDocumentChunks,
    getDocuments,
    getDocumentDetail,
    updateDocumentStatus,
    deleteDocument
} = require("./knowledge.service");

// =====================================================
// 1. HÀM HỖ TRỢ
// =====================================================

const removeUploadedFile = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Không thể xóa file upload:", error);
        }
    }
};

const getErrorStatus = (error) => {
    return error.statusCode || 500;
};

// =====================================================
// 2. UPLOAD VÀ XỬ LÝ TÀI LIỆU
// =====================================================

const uploadKnowledgeDocument = async (req, res, next) => {
    let document = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn tài liệu cần tải lên."
            });
        }

        const {
            title,
            description,
            category,
            scope,
            academicYear,
            version
        } = req.body;

        const file = req.file;

        const fileType = path
            .extname(file.originalname)
            .toLowerCase()
            .replace(".", "");

        // Kiểm tra và trích xuất nội dung
        const parsedResult = await parseDocument(
            file.path,
            fileType
        );

        // Tạo bản ghi tài liệu
        document = await createDocument({
            title: title || path.parse(file.originalname).name,
            description: description || "",
            fileName: file.originalname,
            fileType,
            filePath: file.path,
            category: category || "other",
            scope: scope || "public",
            academicYear: academicYear || "",
            version: version || "1.0",
            uploadedBy: req.user?.userId || null
        });

        // Chia nội dung và lưu các Chunk
        const chunkResult = await saveDocumentChunks(
            document._id,
            parsedResult.text,
            {
                chunkSize: 1000,
                overlap: 200
            }
        );

        return res.status(201).json({
            success: true,
            message: "Tải lên và xử lý tài liệu thành công.",
            data: {
                document: {
                    id: document._id,
                    title: document.title,
                    fileName: document.fileName,
                    fileType: document.fileType,
                    category: document.category,
                    processingStatus: chunkResult.processingStatus
                },
                processing: {
                    characterCount: parsedResult.characterCount,
                    pageCount: parsedResult.pageCount,
                    totalChunks: chunkResult.totalChunks,
                    warnings: parsedResult.warnings
                }
            }
        });

    } catch (error) {
        // Nếu đã tạo tài liệu nhưng xử lý thất bại,
        // xóa bản ghi và các Chunk liên quan.
        if (document?._id) {
            try {
                await deleteDocument(document._id);
            } catch (cleanupError) {
                console.error(
                    "Không thể dọn dữ liệu tài liệu:",
                    cleanupError
                );
            }
        }

        // Xóa file đã upload khi xử lý thất bại
        if (req.file?.path) {
            await removeUploadedFile(req.file.path);
        }

        next(error);
    }
};

// =====================================================
// 3. LẤY DANH SÁCH TÀI LIỆU
// =====================================================

const getKnowledgeDocuments = async (req, res, next) => {
    try {
        const {
            category,
            status,
            processingStatus,
            keyword
        } = req.query;

        const documents = await getDocuments({
            category,
            status,
            processingStatus,
            keyword
        });

        return res.status(200).json({
            success: true,
            total: documents.length,
            data: documents
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// 4. LẤY CHI TIẾT TÀI LIỆU
// =====================================================

const getKnowledgeDocumentDetail = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        const result = await getDocumentDetail(documentId);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// 5. CẬP NHẬT TRẠNG THÁI TÀI LIỆU
// =====================================================

const changeKnowledgeDocumentStatus = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const { status } = req.body;

        const document = await updateDocumentStatus(
            documentId,
            status
        );

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái tài liệu thành công.",
            data: document
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// 6. XÓA TÀI LIỆU
// =====================================================

const removeKnowledgeDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        // Lấy đường dẫn file trước khi xóa bản ghi
        const result = await getDocumentDetail(documentId);
        const filePath = result.document.filePath;

        // Xóa tài liệu và các Chunk trong MongoDB
        await deleteDocument(documentId);

        // Xóa file vật lý trên máy chủ
        await removeUploadedFile(filePath);

        return res.status(200).json({
            success: true,
            message: "Xóa tài liệu thành công."
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// 7. EXPORT CONTROLLER
// =====================================================

module.exports = {
    uploadKnowledgeDocument,
    getKnowledgeDocuments,
    getKnowledgeDocumentDetail,
    changeKnowledgeDocumentStatus,
    removeKnowledgeDocument
};
