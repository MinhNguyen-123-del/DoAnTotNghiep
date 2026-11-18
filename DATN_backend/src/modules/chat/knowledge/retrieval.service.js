
const KnowledgeChunk = require("./models/knowledge-chunk.model");
const KnowledgeDocument = require("./models/knowledge-document.model");

const {
    createCacheKey,
    getCache,
    setCache
} = require("../services/retrieval-cache.service");

const {
    generateQueryEmbedding
} = require("./embedding.service");

// =====================================================
// 1. CẤU HÌNH RETRIEVAL
// =====================================================

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

const DEFAULT_CANDIDATE_LIMIT = 200;
const MAX_CANDIDATE_LIMIT = 1000;

// Giới hạn số Chunk quét vector trong một lần tìm kiếm.
// Phù hợp với Knowledge Base quy mô nhỏ của đồ án.
const MAX_VECTOR_SCAN = 5000;

const DEFAULT_CACHE_TTL = 15 * 60 * 1000;

// Trọng số kết hợp tìm kiếm
const SEMANTIC_WEIGHT = 0.7;
const KEYWORD_WEIGHT = 0.3;

const STOP_WORDS = new Set([
    "toi", "la", "gi", "cua", "va", "cho",
    "voi", "co", "khong", "the", "nao",
    "nhung", "cac", "mot", "nhu", "hay",
    "bao", "nhieu", "duoc", "can", "de",
    "sinh", "vien", "truong", "minh",
    "em", "anh", "chi", "ban", "ve",
    "tai", "trong", "khi", "thi", "se",
    "du", "neu", "do", "nay", "kia"
]);

// =====================================================
// 2. CHUẨN HÓA VĂN BẢN
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
// 3. TÁCH TỪ KHÓA
// =====================================================

const extractKeywords = (question) => {
    return normalizeText(question)
        .split(" ")
        .filter(word =>
            word.length >= 2 &&
            !STOP_WORDS.has(word)
        );
};

const escapeRegex = (value) => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// =====================================================
// 4. TÍNH ĐIỂM TỪ KHÓA
// =====================================================

const calculateRelevanceScore = (content, keywords) => {
    const normalizedContent = normalizeText(content);

    if (!keywords.length || !normalizedContent) {
        return 0;
    }

    let matchedKeywords = 0;
    let totalOccurrences = 0;

    for (const keyword of new Set(keywords)) {
        const escapedKeyword = escapeRegex(keyword);

        const matches = normalizedContent.match(
            new RegExp(`\\b${escapedKeyword}\\b`, "g")
        );

        if (matches && matches.length > 0) {
            matchedKeywords += 1;
            totalOccurrences += Math.min(matches.length, 3);
        }
    }

    // Tỷ lệ từ khóa được tìm thấy
    const coverage = matchedKeywords / new Set(keywords).size;

    // Điểm cộng nhẹ cho số lần xuất hiện
    const occurrenceBonus = Math.min(
        totalOccurrences / (keywords.length * 3),
        1
    );

    return Math.min(
        coverage * 0.8 + occurrenceBonus * 0.2,
        1
    );
};

// =====================================================
// 5. TÍNH COSINE SIMILARITY
// =====================================================

const cosineSimilarity = (vectorA, vectorB) => {
    if (
        !Array.isArray(vectorA) ||
        !Array.isArray(vectorB) ||
        vectorA.length === 0 ||
        vectorA.length !== vectorB.length
    ) {
        return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        const a = Number(vectorA[i]);
        const b = Number(vectorB[i]);

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return 0;
        }

        dotProduct += a * b;
        magnitudeA += a * a;
        magnitudeB += b * b;
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct /
        (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

// Chuyển Cosine Similarity từ [-1, 1] về [0, 1]
const normalizeSemanticScore = (similarity) => {
    return Math.max(0, Math.min(1, similarity));
};

// =====================================================
// 6. TẠO DANH SÁCH NGUỒN
// =====================================================

const buildSources = (results) => {
    const sourceMap = new Map();

    for (const item of results) {
        const documentId = String(item.documentId);

        if (!sourceMap.has(documentId)) {
            sourceMap.set(documentId, {
                documentId: item.documentId,
                title: item.document.title,
                fileName: item.document.fileName,
                category: item.document.category,
                version: item.document.version,
                academicYear: item.document.academicYear,
                pages: []
            });
        }

        const source = sourceMap.get(documentId);

        if (
            item.pageNumber !== null &&
            item.pageNumber !== undefined &&
            !source.pages.includes(item.pageNumber)
        ) {
            source.pages.push(item.pageNumber);
        }
    }

    return Array.from(sourceMap.values());
};

// =====================================================
// 7. TẠO KẾT QUẢ RỖNG
// =====================================================

const createEmptyResult = (question, keywords) => {
    return {
        question,
        keywords,
        total: 0,
        candidateCount: 0,
        results: [],
        sources: [],
        cacheHit: false
    };
};

// =====================================================
// 8. TRUY VẤN KNOWLEDGE BASE
// =====================================================

const searchKnowledge = async (question, options = {}) => {
    // 8.1. Kiểm tra câu hỏi
    if (
        typeof question !== "string" ||
        !question.trim()
    ) {
        const error = new Error(
            "Câu hỏi tìm kiếm không được để trống"
        );

        error.statusCode = 400;
        throw error;
    }

    const {
        limit = DEFAULT_LIMIT,
        category = null,
        candidateLimit = DEFAULT_CANDIDATE_LIMIT,
        cacheTTL = DEFAULT_CACHE_TTL
    } = options;

    // 8.2. Kiểm tra cấu hình
    if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > MAX_LIMIT
    ) {
        const error = new Error(
            `Giới hạn kết quả phải từ 1 đến ${MAX_LIMIT}`
        );

        error.statusCode = 400;
        throw error;
    }

    if (
        !Number.isInteger(candidateLimit) ||
        candidateLimit < 1 ||
        candidateLimit > MAX_CANDIDATE_LIMIT
    ) {
        const error = new Error(
            `Số Chunk ứng viên phải từ 1 đến ${MAX_CANDIDATE_LIMIT}`
        );

        error.statusCode = 400;
        throw error;
    }

    if (!Number.isFinite(cacheTTL) || cacheTTL < 0) {
        const error = new Error("Thời gian Cache không hợp lệ");
        error.statusCode = 400;
        throw error;
    }

    const normalizedQuestion = question.trim();
    const keywords = extractKeywords(normalizedQuestion);

    // 8.3. Tạo Cache Key
    const cacheKey = createCacheKey(normalizedQuestion, {
        limit,
        category,
        candidateLimit
    });

    const cachedResult = getCache(cacheKey);

    if (cachedResult) {
        return {
            ...cachedResult,
            cacheHit: true
        };
    }

    // 8.4. Lấy các tài liệu hợp lệ
    const documentQuery = {
        status: "active",
        processingStatus: "completed"
    };

    if (category) {
        documentQuery.category = category;
    }

    const documents = await KnowledgeDocument.find(documentQuery)
        .select("_id title fileName category version academicYear")
        .lean();

    if (documents.length === 0) {
        const emptyResult = createEmptyResult(
            normalizedQuestion,
            keywords
        );

        setCache(cacheKey, emptyResult, cacheTTL);
        return emptyResult;
    }

    const documentMap = new Map();

    for (const document of documents) {
        documentMap.set(String(document._id), document);
    }

    const documentIds = documents.map(document => document._id);

    // 8.5. Tạo Embedding cho câu hỏi
    const queryEmbedding = await generateQueryEmbedding(
        normalizedQuestion
    );

    // 8.6. Tìm Chunk theo từ khóa
    let keywordChunks = [];

    if (keywords.length > 0) {
        const searchConditions = [...new Set(keywords)].map(keyword => ({
            normalizedContent: {
                $regex: escapeRegex(keyword),
                $options: "i"
            }
        }));

        keywordChunks = await KnowledgeChunk.find({
            document: { $in: documentIds },
            $or: searchConditions
        })
            .select(
                "document content chunkIndex pageNumber sectionTitle embedding"
            )
            .limit(candidateLimit)
            .lean();
    }

    // 8.7. Lấy Chunk có vector để tìm kiếm ngữ nghĩa
    const vectorChunks = await KnowledgeChunk.find({
        document: { $in: documentIds },
        "embedding.0": { $exists: true }
    })
        .select(
            "document content chunkIndex pageNumber sectionTitle embedding"
        )
        .sort({ document: 1, chunkIndex: 1 })
        .limit(MAX_VECTOR_SCAN)
        .lean();

    // 8.8. Gộp hai tập ứng viên, loại bỏ trùng lặp
    const candidateMap = new Map();

    for (const chunk of keywordChunks) {
        candidateMap.set(String(chunk._id), chunk);
    }

    for (const chunk of vectorChunks) {
        candidateMap.set(String(chunk._id), chunk);
    }

    const candidates = Array.from(candidateMap.values());

    if (candidates.length === 0) {
        const emptyResult = createEmptyResult(
            normalizedQuestion,
            keywords
        );

        setCache(cacheKey, emptyResult, cacheTTL);
        return emptyResult;
    }

    // 8.9. Tính điểm kết hợp
    const rankedResults = candidates
        .map(chunk => {
            const document = documentMap.get(
                String(chunk.document)
            );

            if (!document) {
                return null;
            }

            const keywordScore = calculateRelevanceScore(
                chunk.normalizedContent || chunk.content,
                keywords
            );

            const similarity = cosineSimilarity(
                queryEmbedding,
                chunk.embedding
            );

            const hasEmbedding =
                Array.isArray(chunk.embedding) &&
                chunk.embedding.length === queryEmbedding.length;

            const semanticScore = hasEmbedding
                ? normalizeSemanticScore(similarity)
                : 0;

            // Nếu Chunk có vector, kết hợp cả hai phương pháp.
            // Nếu chưa có vector, vẫn cho phép tìm bằng từ khóa.
            const combinedScore = hasEmbedding
                ? semanticScore * SEMANTIC_WEIGHT +
                  keywordScore * KEYWORD_WEIGHT
                : keywordScore;

            if (combinedScore <= 0) {
                return null;
            }

            return {
                chunkId: chunk._id,
                documentId: document._id,
                content: chunk.content,
                chunkIndex: chunk.chunkIndex,
                pageNumber: chunk.pageNumber,
                sectionTitle: chunk.sectionTitle,

                document: {
                    title: document.title,
                    fileName: document.fileName,
                    category: document.category,
                    version: document.version,
                    academicYear: document.academicYear
                },

                relevanceScore: Number(combinedScore.toFixed(6)),
                semanticScore: Number(semanticScore.toFixed(6)),
                keywordScore: Number(keywordScore.toFixed(6)),
                similarity: Number(similarity.toFixed(6))
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }

            return a.chunkIndex - b.chunkIndex;
        });

    // 8.10. Lấy Top-K
    const topResults = rankedResults.slice(0, limit);

    // 8.11. Tạo danh sách nguồn
    const sources = buildSources(topResults);

    // 8.12. Trả kết quả
    const result = {
        question: normalizedQuestion,
        keywords,
        candidateCount: candidates.length,
        total: topResults.length,
        results: topResults,
        sources,
        cacheHit: false
    };

    setCache(cacheKey, result, cacheTTL);

    return result;
};

// =====================================================
// 9. TẠO CONTEXT CHO GEMINI
// =====================================================

const buildKnowledgeContext = (searchResult) => {
    if (
        !searchResult ||
        !Array.isArray(searchResult.results) ||
        searchResult.results.length === 0
    ) {
        return "Không tìm thấy tài liệu phù hợp trong Knowledge Base.";
    }

    return searchResult.results
        .map((item, index) => {
            const page =
                item.pageNumber !== null &&
                item.pageNumber !== undefined
                    ? `Trang ${item.pageNumber}`
                    : "Chưa xác định trang";

            return `
[NGUỒN ${index + 1}]
Tên tài liệu: ${item.document.title}
Tên file: ${item.document.fileName}
Danh mục: ${item.document.category}
Vị trí: ${page}
Mục: ${item.sectionTitle || "Không xác định"}
Điểm liên quan: ${item.relevanceScore}
Điểm ngữ nghĩa: ${item.semanticScore}
Điểm từ khóa: ${item.keywordScore}

Nội dung:
${item.content}
`;
        })
        .join("\n--------------------------\n");
};

// =====================================================
// 10. EXPORT
// =====================================================

module.exports = {
    normalizeText,
    extractKeywords,
    calculateRelevanceScore,
    cosineSimilarity,
    buildSources,
    searchKnowledge,
    buildKnowledgeContext
};
