
const mongoose = require("mongoose");
const connectDB = require("../config/database");

// Import toàn bộ Model
const Conversation = require("../modules/chat/models/conversation.model");
const Message = require("../modules/chat/models/message.model");
const AIUsage = require("../modules/chat/models/ai-usage.model");

const KnowledgeDocument = require("../modules/chat/knowledge/models/knowledge-document.model");
const KnowledgeChunk = require("../modules/chat/knowledge/models/knowledge-chunk.model");

// Import Service
const chatService = require("../modules/chat/chat.service");

const {
    detectIntent
} = require("../modules/chat/services/intent.service");

const {
    validateSendMessage
} = require("../modules/chat/chat.validation");

const {
    searchKnowledge
} = require("../modules/chat/knowledge/retrieval.service");

const {
    getStudentContext
} = require("../modules/chat/services/student-context.service");

const StudentProfile = require("../modules/students/student-profile.model");

// =====================================================
// HÀM KIỂM THỬ
// =====================================================

const runTest = (name, callback) => {
    try {
        callback();
        console.log(`[PASS] ${name}`);
        return true;
    } catch (error) {
        console.log(`[FAIL] ${name}: ${error.message}`);
        return false;
    }
};

// =====================================================
// CHẠY KIỂM THỬ
// =====================================================

const testChatModule = async () => {
    let passed = 0;
    let failed = 0;

    try {
        console.log("\n========================================");
        console.log("KIỂM THỬ TỔNG THỂ CHAT MODULE");
        console.log("========================================\n");

        // 1. Kết nối MongoDB
        await connectDB();
        console.log("[PASS] Kết nối MongoDB");

        // 2. Kiểm tra Model
        const models = [
            Conversation,
            Message,
            AIUsage,
            KnowledgeDocument,
            KnowledgeChunk
        ];

        models.forEach(model => {
            const result = runTest(
                `Model ${model.modelName}`,
                () => {
                    if (!model || !model.modelName) {
                        throw new Error("Model chưa được đăng ký");
                    }
                }
            );

            result ? passed++ : failed++;
        });

        // 3. Kiểm tra Intent Service
        const intentResult = runTest(
            "Intent Service",
            () => {
                const result = detectIntent(
                    "GPA hiện tại của tôi là bao nhiêu?"
                );

                if (result.intent !== "academic_gpa") {
                    throw new Error("Nhận diện Intent không chính xác");
                }
            }
        );

        intentResult ? passed++ : failed++;

        // 4. Kiểm tra Validation
        const validationResult = runTest(
            "Chat Validation",
            () => {
                const result = validateSendMessage({
                    question: "Xin chào"
                });

                if (result.question !== "Xin chào") {
                    throw new Error("Validation trả về dữ liệu sai");
                }
            }
        );

        validationResult ? passed++ : failed++;

        // 5. Kiểm tra Student Profile
        const student = await StudentProfile.findOne({
            studentCode: "TEST20230001"
        });

        const studentResult = runTest(
            "Tìm sinh viên mẫu",
            () => {
                if (!student) {
                    throw new Error("Không tìm thấy TEST20230001");
                }
            }
        );

        studentResult ? passed++ : failed++;

        // 6. Kiểm tra Student Context
        if (student) {
            try {
                await getStudentContext(student._id.toString());

                console.log("[PASS] Student Context Service");
                passed++;
            } catch (error) {
                console.log(
                    `[FAIL] Student Context Service: ${error.message}`
                );
                failed++;
            }
        }

        // 7. Kiểm tra Retrieval Service
        try {
            const retrievalResult = await searchKnowledge(
                "Điều kiện tốt nghiệp",
                { limit: 5 }
            );

            console.log("[PASS] Retrieval Service");
            console.log(
                "Số Chunk tìm thấy:",
                retrievalResult.total
            );
            passed++;
        } catch (error) {
            console.log(
                `[FAIL] Retrieval Service: ${error.message}`
            );
            failed++;
        }

        // 8. Kiểm tra Chat Service có các hàm cần thiết
        const chatServiceResult = runTest(
            "Chat Service exports",
            () => {
                const requiredFunctions = [
                    "sendMessage",
                    "getConversations",
                    "getConversationDetail",
                    "updateConversationStatus",
                    "deleteConversation"
                ];

                for (const functionName of requiredFunctions) {
                    if (typeof chatService[functionName] !== "function") {
                        throw new Error(
                            `Thiếu hàm ${functionName}`
                        );
                    }
                }
            }
        );

        chatServiceResult ? passed++ : failed++;

        // Tổng kết
        console.log("\n========================================");
        console.log("KẾT QUẢ KIỂM THỬ");
        console.log("========================================");
        console.log("Thành công:", passed);
        console.log("Thất bại:", failed);
        console.log("Tổng kiểm thử:", passed + failed);
        console.log("========================================");

        if (failed > 0) {
            process.exitCode = 1;
        }

    } catch (error) {
        console.error("\nLỖI KIỂM THỬ:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("\nĐã đóng kết nối MongoDB.");
    }
};

testChatModule();
