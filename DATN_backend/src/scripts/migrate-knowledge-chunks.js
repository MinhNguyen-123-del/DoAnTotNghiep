
const mongoose = require("mongoose");
const connectDB = require("../config/database");

const KnowledgeChunk = require(
    "../modules/chat/knowledge/models/knowledge-chunk.model"
);

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

const migrateChunks = async () => {
    try {
        await connectDB();

        console.log("Bắt đầu cập nhật Knowledge Chunk...");

        const cursor = KnowledgeChunk.find({
            $or: [
                { normalizedContent: { $exists: false } },
                { normalizedContent: "" }
            ]
        }).cursor();

        let updated = 0;

        for (
            let chunk = await cursor.next();
            chunk != null;
            chunk = await cursor.next()
        ) {
            chunk.normalizedContent = normalizeText(chunk.content);

            await chunk.save();

            updated++;

            if (updated % 100 === 0) {
                console.log(`Đã cập nhật ${updated} Chunk`);
            }
        }

        console.log("--------------------------------");
        console.log("HOÀN TẤT MIGRATION");
        console.log("Tổng Chunk đã cập nhật:", updated);
        console.log("--------------------------------");

    } catch (error) {
        console.error("Lỗi Migration:", error);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

migrateChunks();
