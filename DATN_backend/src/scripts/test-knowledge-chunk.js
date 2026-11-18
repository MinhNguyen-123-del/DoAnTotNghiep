
const {
    splitTextIntoChunks
} = require("../modules/chat/knowledge/knowledge.service");

const sampleText = `
Điều 1. Phạm vi áp dụng.

Quy chế này quy định về tổ chức đào tạo, kiểm tra và đánh giá kết quả học tập của sinh viên.

Điều 2. Thời gian đào tạo.

Thời gian đào tạo được thực hiện theo chương trình đào tạo của từng ngành học.

Điều 3. Kết quả học tập.

Kết quả học tập của sinh viên được đánh giá thông qua điểm học phần và điểm trung bình tích lũy.
`;

const chunks = splitTextIntoChunks(
    sampleText,
    150,
    30
);

console.log("TỔNG SỐ CHUNK:", chunks.length);

chunks.forEach((chunk) => {
    console.log("\n-------------------------");
    console.log("Chunk:", chunk.chunkIndex);
    console.log("Nội dung:", chunk.content);
});
