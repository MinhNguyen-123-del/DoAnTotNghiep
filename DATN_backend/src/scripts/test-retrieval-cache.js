
const connectDB = require("../config/database");

const {
    searchKnowledge
} = require("../modules/chat/knowledge/retrieval.service");

const {
    clearCache,
    getCacheStats
} = require("../modules/chat/services/retrieval-cache.service");

const runTest = async () => {
    try {
        console.log("\n========== TEST RAG CACHE ==========\n");

        // Kết nối MongoDB
        await connectDB();

        // Xóa cache trước khi kiểm tra
        clearCache();

        const question = "Điều kiện xét tốt nghiệp đại học là gì?";

        console.log("Câu hỏi:", question);

        // Lần tìm kiếm thứ nhất
        console.log("\n--- Lần 1: Chưa có cache ---");

        const result1 = await searchKnowledge(question, {
            limit: 5
        });

        console.log("Cache hit:", result1.cacheHit);
        console.log("Số kết quả:", result1.results.length);

        // Lần tìm kiếm thứ hai
        console.log("\n--- Lần 2: Sử dụng cache ---");

        const result2 = await searchKnowledge(question, {
            limit: 5
        });

        console.log("Cache hit:", result2.cacheHit);
        console.log("Số kết quả:", result2.results.length);

        // Thống kê cache
        console.log("\n--- Thống kê cache ---");

        console.log(getCacheStats());

        // Đánh giá kết quả
        if (
            result1.cacheHit === false &&
            result2.cacheHit === true
        ) {
            console.log("\nKẾT QUẢ: TEST CACHE THÀNH CÔNG!");
        } else {
            console.log("\nKẾT QUẢ: TEST CACHE CHƯA ĐẠT!");
        }

    } catch (error) {
        console.error("\nLỖI TEST:", error.message);
    } finally {
        // Đóng kết nối MongoDB
        const mongoose = require("mongoose");
        await mongoose.disconnect();
    }
};

runTest();
