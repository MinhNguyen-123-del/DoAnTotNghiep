
/**
 * INTENT SERVICE
 * Phân loại ý định câu hỏi của sinh viên.
 *
 * Mục tiêu:
 * - Xác định sinh viên đang muốn hỏi vấn đề gì.
 * - Xác định có cần dữ liệu học tập cá nhân hay không.
 * - Xác định có cần tra cứu cơ sở tri thức (RAG) hay không.
 *
 * Phiên bản này sử dụng quy tắc và từ khóa,
 * chưa gọi Gemini để phân loại.
 */

// =====================================================
// 1. CHUẨN HÓA CÂU HỎI
// =====================================================

const normalizeText = (text = "") => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// =====================================================
// 2. DANH SÁCH INTENT
// =====================================================

const INTENTS = {
    ACADEMIC_GPA: "academic_gpa",
    ACADEMIC_RESULTS: "academic_results",
    RETAKE_HISTORY: "retake_history",
    STUDY_PROGRESS: "study_progress",
    STUDY_PLAN: "study_plan_advice",
    STUDY_TASKS: "study_tasks",
    STUDY_GOALS: "study_goals",
    GRADUATION_REQUIREMENTS: "graduation_requirements",
    TRAINING_PROGRAM: "training_program",
    REGULATIONS: "academic_regulations",
    STUDY_ADVICE: "study_advice",
    GENERAL_CHAT: "general_chat",
    UNKNOWN: "unknown"
};

// =====================================================
// 3. CÁC QUY TẮC NHẬN DIỆN INTENT
// =====================================================

const INTENT_RULES = [
    {
        intent: INTENTS.ACADEMIC_GPA,
        keywords: [
            "gpa",
            "diem trung binh",
            "diem tich luy",
            "diem he 4",
            "diem trung binh tich luy"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: false
    },
    {
        intent: INTENTS.RETAKE_HISTORY,
        keywords: [
            "hoc lai",
            "thi lai",
            "lich su hoc lai",
            "mon hoc lai",
            "lan hoc thu",
            "ket qua hoc lai"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: false
    },
    {
        intent: INTENTS.STUDY_PROGRESS,
        keywords: [
            "tien do hoc tap",
            "tien do hoc",
            "con bao nhieu tin chi",
            "thieu bao nhieu tin chi",
            "da tich luy bao nhieu tin chi",
            "hoan thanh bao nhieu tin chi",
            "con bao nhieu mon",
            "da hoan thanh bao nhieu mon"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: false
    },
    {
        intent: INTENTS.ACADEMIC_RESULTS,
        keywords: [
            "bang diem",
            "ket qua hoc tap",
            "diem cac mon",
            "diem tung mon",
            "ket qua cac mon",
            "mon nao bi truot",
            "mon nao chua dat"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: false
    },
    {
        intent: INTENTS.STUDY_TASKS,
        keywords: [
            "cong viec hoc tap",
            "nhiem vu hoc tap",
            "deadline",
            "viec can lam",
            "cong viec sap toi",
            "nhiem vu sap toi"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: false
    },
    {
        intent: INTENTS.STUDY_GOALS,
        keywords: [
            "muc tieu hoc tap",
            "muc tieu cua toi",
            "tien do muc tieu",
            "muc tieu gpa",
            "muc tieu diem"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: false
    },
    {
        intent: INTENTS.STUDY_PLAN,
        keywords: [
            "ke hoach hoc tap",
            "lap ke hoach hoc",
            "sap xep lich hoc",
            "nen hoc mon nao",
            "chon mon hoc",
            "hoc ky toi",
            "ky hoc toi",
            "ke hoach hoc ky"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: true
    },
    {
        intent: INTENTS.GRADUATION_REQUIREMENTS,
        keywords: [
            "dieu kien tot nghiep",
            "tot nghiep can",
            "bao nhieu tin chi de tot nghiep",
            "diem tot nghiep",
            "xet tot nghiep",
            "chuan dau ra",
            "dieu kien ra truong"
        ],
        requiresStudentContext: false,
        requiresKnowledgeBase: true
    },
    {
        intent: INTENTS.TRAINING_PROGRAM,
        keywords: [
            "chuong trinh dao tao",
            "chuong trinh hoc",
            "lo trinh hoc",
            "cac hoc phan",
            "mon tien quyet",
            "mon hoc bat buoc",
            "mon hoc tu chon"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: true
    },
    {
        intent: INTENTS.REGULATIONS,
        keywords: [
            "quy che",
            "quy dinh",
            "quy che dao tao",
            "quy dinh hoc vu",
            "quy dinh thi",
            "quy dinh diem",
            "hoc lai co bi",
            "bao luu ket qua",
            "canh bao hoc tap"
        ],
        requiresStudentContext: false,
        requiresKnowledgeBase: true
    },
    {
        intent: INTENTS.STUDY_ADVICE,
        keywords: [
            "tu van hoc tap",
            "cai thien diem",
            "nang cao gpa",
            "hoc the nao",
            "phuong phap hoc",
            "bi mat goc",
            "hoc khong hieu",
            "nen hoc nhu the nao",
            "loi khuyen hoc tap"
        ],
        requiresStudentContext: true,
        requiresKnowledgeBase: false
    }
];

// =====================================================
// 4. NHẬN DIỆN CHÀO HỎI
// =====================================================

const isGreeting = (question) => {
    const greetings = [
        "xin chao",
        "chao ban",
        "hello",
        "hi",
        "hey",
        "cam on",
        "cam on ban",
        "tam biet"
    ];

    return greetings.some(item =>
        question === item || question.startsWith(item + " ")
    );
};

// =====================================================
// 5. PHÂN LOẠI Ý ĐỊNH
// =====================================================

const detectIntent = (rawQuestion) => {
    if (
        typeof rawQuestion !== "string" ||
        !rawQuestion.trim()
    ) {
        const error = new Error("Câu hỏi không được để trống");
        error.statusCode = 400;
        throw error;
    }

    const question = normalizeText(rawQuestion);

    // Kiểm tra câu chào hỏi
    if (isGreeting(question)) {
        return {
            intent: INTENTS.GENERAL_CHAT,
            confidence: 1,
            requiresStudentContext: false,
            requiresKnowledgeBase: false,
            normalizedQuestion: question
        };
    }

    // Duyệt danh sách quy tắc
    for (const rule of INTENT_RULES) {
        const matchedKeyword = rule.keywords.find(keyword =>
            question.includes(keyword)
        );

        if (matchedKeyword) {
            return {
                intent: rule.intent,
                confidence: 0.9,
                matchedKeyword,
                requiresStudentContext: rule.requiresStudentContext,
                requiresKnowledgeBase: rule.requiresKnowledgeBase,
                normalizedQuestion: question
            };
        }
    }

    // Không nhận diện được thì chuyển sang UNKNOWN
    return {
        intent: INTENTS.UNKNOWN,
        confidence: 0,
        requiresStudentContext: false,
        requiresKnowledgeBase: false,
        normalizedQuestion: question
    };
};

// =====================================================
// 6. EXPORT
// =====================================================

module.exports = {
    INTENTS,
    normalizeText,
    detectIntent
};
