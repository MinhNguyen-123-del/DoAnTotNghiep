
const crypto = require("crypto");

// =====================================================
// 1. CẤU HÌNH CACHE
// =====================================================

const CACHE_TTL = 15 * 60 * 1000; // 15 phút
const MAX_CACHE_ENTRIES = 500;

const cacheStore = new Map();

const cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    expired: 0,
    evictions: 0
};

// =====================================================
// 2. CHUẨN HÓA CÂU HỎI
// =====================================================

const normalizeQuestion = (question) => {
    return String(question || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// =====================================================
// 3. TẠO CACHE KEY
// =====================================================

const createCacheKey = (question, options = {}) => {
    const normalizedQuestion = normalizeQuestion(question);

    const keyData = JSON.stringify({
        question: normalizedQuestion,
        category: options.category || null,
        limit: options.limit ?? 5,
        candidateLimit: options.candidateLimit ?? 200
    });

    return crypto
        .createHash("sha256")
        .update(keyData)
        .digest("hex");
};

// =====================================================
// 4. LẤY DỮ LIỆU CACHE
// =====================================================

const getCache = (key) => {
    if (typeof key !== "string" || !key) {
        return null;
    }

    const cached = cacheStore.get(key);

    if (!cached) {
        cacheStats.misses++;
        return null;
    }

    // Kiểm tra thời hạn
    if (Date.now() >= cached.expiresAt) {
        cacheStore.delete(key);

        cacheStats.expired++;
        cacheStats.misses++;

        return null;
    }

    // Đưa phần tử vừa truy cập lên cuối Map
    // Đây là cơ chế LRU
    cacheStore.delete(key);
    cacheStore.set(key, cached);

    cacheStats.hits++;

    return cached.data;
};

// =====================================================
// 5. LƯU DỮ LIỆU CACHE
// =====================================================

const setCache = (
    key,
    data,
    ttl = CACHE_TTL
) => {
    if (
        typeof key !== "string" ||
        !key ||
        ttl <= 0 ||
        !Number.isFinite(ttl) ||
        data === undefined
    ) {
        return false;
    }

    // Nếu key đã tồn tại, xóa trước để cập nhật thứ tự LRU
    if (cacheStore.has(key)) {
        cacheStore.delete(key);
    }

    // Xóa phần tử ít được sử dụng gần đây nhất
    if (cacheStore.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cacheStore.keys().next().value;

        if (oldestKey !== undefined) {
            cacheStore.delete(oldestKey);
            cacheStats.evictions++;
        }
    }

    cacheStore.set(key, {
        data,
        expiresAt: Date.now() + ttl
    });

    cacheStats.sets++;

    return true;
};

// =====================================================
// 6. XÓA TOÀN BỘ CACHE
// =====================================================

const clearCache = () => {
    const deletedEntries = cacheStore.size;

    cacheStore.clear();

    return {
        message: "Đã xóa toàn bộ Cache",
        deletedEntries
    };
};

// =====================================================
// 7. THỐNG KÊ CACHE
// =====================================================

const getCacheStats = () => {
    // Loại bỏ các phần tử hết hạn
    const now = Date.now();

    for (const [key, cached] of cacheStore.entries()) {
        if (now >= cached.expiresAt) {
            cacheStore.delete(key);
            cacheStats.expired++;
        }
    }

    const totalRequests =
        cacheStats.hits + cacheStats.misses;

    const hitRate = totalRequests > 0
        ? Number(
            ((cacheStats.hits / totalRequests) * 100).toFixed(2)
        )
        : 0;

    return {
        ...cacheStats,
        currentEntries: cacheStore.size,
        maxEntries: MAX_CACHE_ENTRIES,
        ttlMinutes: CACHE_TTL / 60000,
        totalRequests,
        hitRate: `${hitRate}%`
    };
};

// =====================================================
// 8. RESET THỐNG KÊ
// =====================================================

const resetCacheStats = () => {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.sets = 0;
    cacheStats.expired = 0;
    cacheStats.evictions = 0;

    return getCacheStats();
};

// =====================================================
// 9. EXPORT
// =====================================================

module.exports = {
    createCacheKey,
    getCache,
    setCache,
    clearCache,
    getCacheStats,
    resetCacheStats
};
