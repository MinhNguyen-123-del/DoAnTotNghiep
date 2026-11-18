
const { gemini, GEMINI_MODEL } = require("../config/gemini");

// Hàm chờ trước khi thử lại
const delay = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

// Gửi yêu cầu đến Gemini
async function generateResponse({
    question,
    systemInstruction = "",
    history = []
}) {
    if (!question || !question.trim()) {
        throw new Error("Câu hỏi không được để trống");
    }

    const contents = [
        ...history,
        {
            role: "user",
            parts: [{ text: question.trim() }]
        }
    ];

    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await gemini.models.generateContent({
                model: GEMINI_MODEL,
                contents,
                config: {
                    systemInstruction:
                        systemInstruction ||
                        "Bạn là trợ lý tư vấn học tập. Hãy trả lời bằng tiếng Việt, rõ ràng, chính xác và không tự bịa thông tin."
                }
            });

            const answer = response.text;

            if (!answer) {
                throw new Error("Gemini không trả về nội dung");
            }

            return {
                success: true,
                answer,
                model: GEMINI_MODEL,
                usage: {
                    promptTokens:
                        response.usageMetadata?.promptTokenCount || 0,
                    completionTokens:
                        response.usageMetadata?.candidatesTokenCount || 0,
                    totalTokens:
                        response.usageMetadata?.totalTokenCount || 0
                }
            };

        } catch (error) {
            const status = error.status || error.code;

            const isTemporaryError =
                status === 503 ||
                status === 429 ||
                status === 500;

            if (!isTemporaryError || attempt === maxRetries) {
                throw error;
            }

            await delay(2000 * Math.pow(2, attempt));
        }
    }
}

module.exports = {
    generateResponse
};
