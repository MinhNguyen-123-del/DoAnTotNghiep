const mongoose = require("mongoose");
const {
    generateEmbeddings
} = require("./embedding.service");
const {
    clearCache
} = require("../services/retrieval-cache.service");

const KnowledgeDocument = require("./models/knowledge-document.model");
const KnowledgeChunk = require("./models/knowledge-chunk.model");

// =====================================================
// 1. HÀM HỖ TRỢ
// =====================================================

// Tạo lỗi nghiệp vụ
const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Kiểm tra ObjectId
const validateObjectId = (id, fieldName = "ID") => {
    if (
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
    ) {
        throw createError(`${fieldName} không hợp lệ`);
    }
};

// Escape ký tự đặc biệt trong Regex
const escapeRegex = (value) => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// =====================================================
// 2. CHIA NỘI DUNG THÀNH CÁC CHUNK
// =====================================================

const splitTextIntoChunks = (
    text,
    chunkSize = 1000,
    overlap = 200
) => {
    if (typeof text !== "string" || !text.trim()) {
        throw createError("Nội dung tài liệu không được để trống");
    }

    if (
        !Number.isInteger(chunkSize) ||
        !Number.isInteger(overlap) ||
        chunkSize <= 0 ||
        overlap < 0 ||
        overlap >= chunkSize
    ) {
        throw createError("Thông số chia Chunk không hợp lệ");
    }

    // Chuẩn hóa nội dung
    const normalizedText = text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const chunks = [];

    let start = 0;

    while (start < normalizedText.length) {
        let end = Math.min(
            start + chunkSize,
            normalizedText.length
        );

        // Ưu tiên cắt tại dấu xuống dòng hoặc dấu câu
        if (end < normalizedText.length) {
            const searchStart = start + Math.floor(chunkSize * 0.7);

            const possibleBreaks = [
                normalizedText.lastIndexOf("\n", end),
                normalizedText.lastIndexOf(". ", end),
                normalizedText.lastIndexOf("? ", end),
                normalizedText.lastIndexOf("! ", end),
                normalizedText.lastIndexOf("; ", end)
            ];

            const validBreaks = possibleBreaks.filter(
                position => position >= searchStart
            );

            if (validBreaks.length > 0) {
                end = Math.max(...validBreaks) + 1;
            }
        }

        const content = normalizedText
            .slice(start, end)
            .trim();

        if (content) {
            chunks.push({
                chunkIndex: chunks.length,
                content
            });
        }

        if (end >= normalizedText.length) {
            break;
        }

        // Lùi lại một phần nội dung để giữ ngữ cảnh
        start = Math.max(
            end - overlap,
            start + 1
        );
    }

    return chunks;
};

// =====================================================
// 3. TẠO TÀI LIỆU
// =====================================================

const createDocument = async (data = {}) => {
    const {
        title,
        description,
        fileName,
        fileType,
        filePath,
        category,
        scope,
        academicYear,
        version,
        uploadedBy
    } = data;

    if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof fileName !== "string" ||
        !fileName.trim() ||
        typeof fileType !== "string" ||
        !fileType.trim()
    ) {
        throw createError(
            "Tên tài liệu, tên file và loại file là bắt buộc"
        );
    }

    const normalizedFileType = fileType
        .trim()
        .toLowerCase();

    const allowedFileTypes = [
        "pdf",
        "docx",
        "txt"
    ];

    if (!allowedFileTypes.includes(normalizedFileType)) {
        throw createError("Định dạng tài liệu không được hỗ trợ");
    }

    const document = await KnowledgeDocument.create({
        title: title.trim(),
        description,
        fileName: fileName.trim(),
        fileType: normalizedFileType,
        filePath,
        category,
        scope,
        academicYear,
        version,
        uploadedBy,
        processingStatus: "pending",
        status: "active"
    });

    return document;
};

// =====================================================
// 4. LƯU CÁC CHUNK CỦA TÀI LIỆU
// =====================================================


const saveDocumentChunks = async (
    documentId,
    text,
    options = {}
) => {
    validateObjectId(documentId, "Document ID");

    const document = await KnowledgeDocument.findById(documentId);

    if (!document) {
        throw createError("Không tìm thấy tài liệu", 404);
    }

    if (document.status !== "active") {
        throw createError("Tài liệu không ở trạng thái hoạt động");
    }

    const {
        chunkSize = 1000,
        overlap = 200,
        pageNumber = null,
        sectionTitle = ""
    } = options;

    // Bước 1: Chia văn bản thành các Chunk
    const chunks = splitTextIntoChunks(
        text,
        chunkSize,
        overlap
    );

    if (chunks.length === 0) {
        throw createError("Không tạo được nội dung Chunk");
    }

    const previousProcessingStatus = document.processingStatus;
    const previousProcessedAt = document.processedAt;

    // Lưu Chunk cũ để khôi phục nếu xử lý thất bại
    const oldChunks = await KnowledgeChunk.find({
        document: document._id
    }).lean();

    try {
        document.processingStatus = "processing";
        await document.save();

        // Bước 2: Tạo Embedding cho toàn bộ Chunk
        const embeddingVectors = await generateEmbeddings(
            chunks.map(chunk => chunk.content),
            "RETRIEVAL_DOCUMENT"
        );

        if (embeddingVectors.length !== chunks.length) {
            throw createError("Số lượng Embedding không khớp với Chunk");
        }

        // Bước 3: Chuẩn bị dữ liệu lưu MongoDB
        const chunkDocuments = chunks.map((chunk, index) => ({
            document: document._id,
            chunkIndex: chunk.chunkIndex,

            content: chunk.content,

            normalizedContent: chunk.content
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/[^\w\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim(),

            pageNumber,
            sectionTitle,

            // Vector thực tế từ Gemini
            embedding: embeddingVectors[index],

            metadata: {
                characterCount: chunk.content.length,
                embeddingModel:
                    process.env.GEMINI_EMBEDDING_MODEL ||
                    "gemini-embedding-001",
                embeddingDimension: embeddingVectors[index].length
            }
        }));

        // Bước 4: Thay thế Chunk cũ bằng Chunk mới
        await KnowledgeChunk.deleteMany({
            document: document._id
        });

        await KnowledgeChunk.insertMany(chunkDocuments);

        // Bước 5: Đánh dấu xử lý hoàn tất
        document.processingStatus = "completed";
        document.processedAt = new Date();

        await document.save();

        // Xóa cache tìm kiếm
        clearCache();

        return {
            documentId: document._id,
            totalChunks: chunkDocuments.length,
            processingStatus: document.processingStatus,
            embeddingDimension: embeddingVectors[0].length
        };

    } catch (error) {
        // Khôi phục dữ liệu cũ nếu xử lý thất bại
        try {
            await KnowledgeChunk.deleteMany({
                document: document._id
            });

            if (oldChunks.length > 0) {
                await KnowledgeChunk.insertMany(oldChunks);
            }

            document.processingStatus = previousProcessingStatus;
            document.processedAt = previousProcessedAt;

            await document.save();

        } catch (restoreError) {
            console.error(
                "Lỗi khôi phục dữ liệu Knowledge Chunk:",
                restoreError
            );

            document.processingStatus = "failed";
            await document.save();
        }

        throw error;
    }
};
// =====================================================
// 5. LẤY DANH SÁCH TÀI LIỆU
// =====================================================

const getDocuments = async (filters = {}) => {
    const {
        category,
        status,
        processingStatus,
        keyword
    } = filters;

    const query = {};

    if (category) {
        query.category = category;
    }

    if (status) {
        query.status = status;
    }

    if (processingStatus) {
        query.processingStatus = processingStatus;
    }

    if (
        typeof keyword === "string" &&
        keyword.trim()
    ) {
        const safeKeyword = escapeRegex(keyword.trim());

        query.$or = [
            {
                title: {
                    $regex: safeKeyword,
                    $options: "i"
                }
            },
            {
                fileName: {
                    $regex: safeKeyword,
                    $options: "i"
                }
            }
        ];
    }

    return KnowledgeDocument.find(query)
        .populate("uploadedBy", "email role")
        .sort({ createdAt: -1 })
        .lean();
};

// =====================================================
// 6. LẤY CHI TIẾT TÀI LIỆU
// =====================================================

const getDocumentDetail = async (documentId) => {
    validateObjectId(documentId, "Document ID");

    const document = await KnowledgeDocument.findById(documentId)
        .populate("uploadedBy", "email role")
        .lean();

    if (!document) {
        throw createError("Không tìm thấy tài liệu", 404);
    }

    const chunks = await KnowledgeChunk.find({
        document: document._id
    })
        .sort({ chunkIndex: 1 })
        .select("-embedding")
        .lean();

    return {
        document,
        chunks,
        totalChunks: chunks.length
    };
};

// =====================================================
// 7. CẬP NHẬT TRẠNG THÁI TÀI LIỆU
// =====================================================

const updateDocumentStatus = async (
    documentId,
    status
) => {
    validateObjectId(documentId, "Document ID");

    const allowedStatuses = [
        "active",
        "inactive",
        "archived"
    ];

    if (!allowedStatuses.includes(status)) {
        throw createError("Trạng thái tài liệu không hợp lệ");
    }

    const document = await KnowledgeDocument.findByIdAndUpdate(
        documentId,
        {
            $set: {
                status
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!document) {
        throw createError("Không tìm thấy tài liệu", 404);
    }

    // Xóa cache vì trạng thái tài liệu ảnh hưởng đến kết quả RAG
    clearCache();

    return document;
};

// =====================================================
// 8. XÓA TÀI LIỆU
// =====================================================

const deleteDocument = async (documentId) => {
    validateObjectId(documentId, "Document ID");

    const document = await KnowledgeDocument.findById(documentId);

    if (!document) {
        throw createError("Không tìm thấy tài liệu", 404);
    }

    // Xóa toàn bộ Chunk liên quan
    await KnowledgeChunk.deleteMany({
        document: document._id
    });

    // Xóa tài liệu
    await document.deleteOne();

    // Xóa cache vì tài liệu đã bị xóa khỏi Knowledge Base
    clearCache();

    return {
        message: "Xóa tài liệu và nội dung liên quan thành công"
    };
};

// =====================================================
// 9. EXPORT SERVICE
// =====================================================

module.exports = {
    splitTextIntoChunks,
    createDocument,
    saveDocumentChunks,
    getDocuments,
    getDocumentDetail,
    updateDocumentStatus,
    deleteDocument
};