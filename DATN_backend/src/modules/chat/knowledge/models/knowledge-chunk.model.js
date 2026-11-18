
const mongoose = require("mongoose");

// =====================================================
// 1. HÀM CHUẨN HÓA TIẾNG VIỆT
// =====================================================

const normalizeText = (text = "") => {
    return String(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// =====================================================
// 2. KNOWLEDGE CHUNK SCHEMA
// =====================================================

const knowledgeChunkSchema = new mongoose.Schema(
    {
        // Tài liệu gốc chứa đoạn nội dung
        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "KnowledgeDocument",
            required: true
        },

        // Thứ tự đoạn nội dung trong tài liệu
        chunkIndex: {
            type: Number,
            required: true,
            min: 0
        },

        // Nội dung văn bản gốc của đoạn
        content: {
            type: String,
            required: true,
            trim: true
        },

        // Nội dung đã chuẩn hóa, bỏ dấu tiếng Việt
        // Dùng cho tìm kiếm RAG không phân biệt dấu
        normalizedContent: {
            type: String,
            default: "",
            trim: true
        },

        // Số trang chứa nội dung
        pageNumber: {
            type: Number,
            default: null
        },

        // Tiêu đề mục chứa nội dung
        sectionTitle: {
            type: String,
            default: ""
        },

        // Vector embedding phục vụ tìm kiếm ngữ nghĩa
        embedding: {
            type: [Number],
            default: []
        },

        // Thông tin bổ sung
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// =====================================================
// 3. TỰ ĐỘNG CHUẨN HÓA NỘI DUNG
// =====================================================

// Chạy khi validate/save một Chunk
knowledgeChunkSchema.pre("validate", function () {
    if (this.isModified("content") || !this.normalizedContent) {
        this.normalizedContent = normalizeText(this.content);
    }
});

// =====================================================
// 4. INDEX DATABASE
// =====================================================

// Một tài liệu không được trùng thứ tự Chunk
knowledgeChunkSchema.index(
    {
        document: 1,
        chunkIndex: 1
    },
    {
        unique: true
    }
);

// Index tìm kiếm theo tài liệu
knowledgeChunkSchema.index({
    document: 1
});

// =====================================================
// 5. EXPORT
// =====================================================

module.exports = mongoose.model(
    "KnowledgeChunk",
    knowledgeChunkSchema
);
