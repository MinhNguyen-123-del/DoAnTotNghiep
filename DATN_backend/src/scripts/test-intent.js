
const {
    detectIntent
} = require("../modules/chat/services/intent.service");

// Danh sách câu hỏi kiểm thử
const testQuestions = [
    "GPA hiện tại của tôi là bao nhiêu?",
    "Tôi còn thiếu bao nhiêu tín chỉ để tốt nghiệp?",
    "Tôi đã học lại những môn nào?",
    "Hãy lập kế hoạch học tập cho học kỳ tới",
    "Điều kiện tốt nghiệp của trường là gì?",
    "Quy chế đào tạo của trường như thế nào?",
    "Làm thế nào để cải thiện điểm GPA?",
    "Xin chào bạn",
    "Tôi muốn tìm hiểu về cơ hội việc làm sau khi tốt nghiệp"
];

console.log("\n========== KIỂM THỬ INTENT SERVICE ==========\n");

testQuestions.forEach((question, index) => {
    const result = detectIntent(question);

    console.log(`Câu hỏi ${index + 1}: ${question}`);
    console.log("Kết quả:", result);
    console.log("--------------------------------------------");
});
