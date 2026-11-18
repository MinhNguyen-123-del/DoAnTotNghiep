
const { gemini } = require("../../../config/gemini");

const EMBEDDING_MODEL =
    process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

const EMBEDDING_DIMENSION = Number(
    process.env.GEMINI_EMBEDDING_DIMENSION || 768
);

const BATCH_SIZE = 32;

/**
 * Tạo vector cho một nhóm văn bản.
 *
 * taskType:
 * - RETRIEVAL_DOCUMENT: dùng cho nội dung tài liệu.
 * - RETRIEVAL_QUERY: dùng cho câu hỏi tìm kiếm.
 */
const generateEmbeddings = async (
    texts,
    taskType = "RETRIEVAL_DOCUMENT"
) => {
    if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error("Danh sách văn bản tạo Embedding không hợp lệ.");
    }

    if (!["RETRIEVAL_DOCUMENT", "RETRIEVAL_QUERY"].includes(taskType)) {
        throw new Error("Embedding taskType không hợp lệ.");
    }

    const validTexts = texts.map((text) => {
        if (typeof text !== "string" || !text.trim()) {
            throw new Error("Văn bản tạo Embedding không được để trống.");
        }

        return text.trim();
    });

    const allEmbeddings = [];

    // Chia batch để tránh gửi quá nhiều nội dung trong một request
    for (let i = 0; i < validTexts.length; i += BATCH_SIZE) {
        const batch = validTexts.slice(i, i + BATCH_SIZE);

        const response = await gemini.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: batch,
            config: {
                taskType,
                outputDimensionality: EMBEDDING_DIMENSION
            }
        });

        if (
            !response.embeddings ||
            response.embeddings.length !== batch.length
        ) {
            throw new Error("Gemini trả về số lượng Embedding không khớp.");
        }

        const batchEmbeddings = response.embeddings.map((item) => {
            const values = item.values;

            if (
                !Array.isArray(values) ||
                values.length !== EMBEDDING_DIMENSION ||
                values.some((value) => !Number.isFinite(value))
            ) {
                throw new Error("Vector Embedding trả về không hợp lệ.");
            }

            return values;
        });

        allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
};

/**
 * Tạo Embedding cho một câu hỏi.
 */
const generateQueryEmbedding = async (question) => {
    const embeddings = await generateEmbeddings(
        [question],
        "RETRIEVAL_QUERY"
    );

    return embeddings[0];
};

module.exports = {
    generateEmbeddings,
    generateQueryEmbedding,
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSION
};
