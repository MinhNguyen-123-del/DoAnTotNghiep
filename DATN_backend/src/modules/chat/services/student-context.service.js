
const mongoose = require("mongoose");

// Import Academic Service của Module 1
const academicService = require("../../academic/academic.service");

// Import Study Plan Service của Module 2
const studyPlanService = require("../../study-plans/study-plan.service");

// ======================================================
// 1. KIỂM TRA STUDENT ID
// ======================================================

const validateStudentId = (studentId) => {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        const error = new Error("Student ID không hợp lệ");
        error.statusCode = 400;
        throw error;
    }
};

// ======================================================
// 2. LẤY KẾT QUẢ HỌC TẬP MỚI NHẤT
// ======================================================

const getLatestAcademicRecords = async (studentId) => {
    const records = await academicService.getConfirmedRecords(studentId);

    // Chọn lần học mới nhất của từng môn
    const latestRecords = new Map();

    for (const record of records) {
        const subjectId = record.subject?._id?.toString();

        if (!subjectId) continue;

        if (!latestRecords.has(subjectId)) {
            latestRecords.set(subjectId, record);
        }
    }

    return Array.from(latestRecords.values()).map((record) => ({
        subjectCode: record.subject?.subjectCode || "",
        subjectName: record.subject?.subjectName || "",
        credits: record.creditsSnapshot,
        attemptNumber: record.attemptNumber,
        finalScore10: record.finalScore10,
        gradePoint4: record.gradePoint4,
        isPassed: record.isPassed,
        includedInGPA: record.includedInGPA,
        semesterName: record.semester?.semesterName || ""
    }));
};

// ======================================================
// 3. LẤY KẾ HOẠCH HỌC TẬP
// ======================================================

const getStudentStudyPlans = async (studentId) => {
    const plans = await studyPlanService.getStudyPlans(studentId);

    const planDetails = await Promise.all(
        plans.map(async (plan) => {
            const detail = await studyPlanService.getStudyPlanDetail(
                studentId,
                plan._id
            );

            return {
                id: plan._id,
                planName: plan.planName,
                status: plan.status,
                semester: plan.semester
                    ? {
                        semesterCode: plan.semester.semesterCode,
                        semesterName: plan.semester.semesterName,
                        academicYear: plan.semester.academicYear
                    }
                    : null,

                totalPlannedCredits: plan.totalPlannedCredits,

                courses: detail.courses.map((course) => ({
                    subjectCode: course.subject?.subjectCode || "",
                    subjectName: course.subject?.subjectName || "",
                    credits: course.creditsSnapshot,
                    status: course.status
                })),

                tasks: detail.tasks.map((task) => ({
                    title: task.title,
                    dueDate: task.dueDate,
                    priority: task.priority,
                    status: task.status
                })),

                goals: detail.goals.map((goal) => ({
                    goalName: goal.goalName,
                    goalType: goal.goalType,
                    targetValue: goal.targetValue,
                    currentValue: goal.currentValue,
                    status: goal.status
                }))
            };
        })
    );

    return planDetails;
};

// ======================================================
// 4. TỔNG HỢP NGỮ CẢNH SINH VIÊN
// ======================================================

const getStudentContext = async (studentId) => {
    validateStudentId(studentId);

    // Lấy các dữ liệu học tập
    const [
        academicSummary,
        studyProgress,
        academicRecords,
        studyPlans
    ] = await Promise.all([
        academicService.getAcademicSummary(studentId),
        academicService.getStudyProgress(studentId),
        getLatestAcademicRecords(studentId),
        getStudentStudyPlans(studentId)
    ]);

    // Tổng hợp dữ liệu phục vụ AI
    return {
        student: academicSummary.student,

        academic: {
            ...academicSummary.academic,
            records: academicRecords
        },

        studyProgress: studyProgress,

        studyPlans: studyPlans,

        generatedAt: new Date().toISOString()
    };
};

// ======================================================
// 5. CHUYỂN NGỮ CẢNH THÀNH TEXT CHO GEMINI
// ======================================================

const buildStudentContextPrompt = (context) => {
    return `
THÔNG TIN HỌC TẬP CỦA SINH VIÊN

1. THÔNG TIN SINH VIÊN
- Mã sinh viên: ${context.student.studentCode}
- Họ tên: ${context.student.fullName}
- Ngành học: ${context.student.major}
- Khóa học: ${context.student.cohort}

2. KẾT QUẢ HỌC TẬP
- GPA tích lũy: ${context.academic.gpa ?? "Chưa có dữ liệu"}
- Thang điểm: 4
- Tín chỉ dùng tính GPA: ${context.academic.totalGPACredits}
- Tín chỉ đã tích lũy: ${context.academic.earnedCredits}
- Số môn đã đạt: ${context.academic.passedSubjects}
- Số môn chưa đạt: ${context.academic.failedSubjects}

3. CHI TIẾT KẾT QUẢ CÁC MÔN HỌC
${JSON.stringify(context.academic.records, null, 2)}

4. TIẾN ĐỘ CHƯƠNG TRÌNH ĐÀO TẠO
${JSON.stringify(context.studyProgress, null, 2)}

5. KẾ HOẠCH HỌC TẬP
${JSON.stringify(context.studyPlans, null, 2)}

NGUYÊN TẮC SỬ DỤNG DỮ LIỆU:
- Chỉ sử dụng dữ liệu được cung cấp trong ngữ cảnh.
- Không tự tạo điểm số, GPA hoặc tín chỉ.
- Nếu thiếu dữ liệu, phải thông báo rõ chưa có dữ liệu.
- Phân biệt GPA hệ 4 và điểm môn học hệ 10.
- Không tự suy đoán quy chế của trường.
- Đưa ra lời khuyên dựa trên kết quả học tập thực tế.
- Trả lời bằng tiếng Việt, rõ ràng và dễ hiểu.
`;
};

// ======================================================
// EXPORT SERVICE
// ======================================================

module.exports = {
    getStudentContext,
    buildStudentContextPrompt
};
