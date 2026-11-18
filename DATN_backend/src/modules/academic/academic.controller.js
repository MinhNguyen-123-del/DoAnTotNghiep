
const academicService = require("./academic.service");

// =====================================================
// 1. LẤY TỔNG QUAN HỌC TẬP CỦA SINH VIÊN
// =====================================================

const getStudentSummary = async (req, res, next) => {
    try {
        // Lấy ID sinh viên từ tham số URL
        const { studentId } = req.params;

        // Gọi Service lấy tổng quan học tập
        const result = await academicService.getAcademicSummary(studentId);

        // Trả kết quả về Client
        return res.status(200).json({
            success: true,
            message: "Lấy tổng quan học tập thành công",
            data: result
        });
    } catch (error) {
        // Chuyển lỗi sang Error Middleware
        next(error);
    }
};

// =====================================================
// 2. LẤY GPA CỦA SINH VIÊN
// =====================================================

const getStudentGPA = async (req, res, next) => {
    try {
        // Lấy ID sinh viên từ URL
        const { studentId } = req.params;

        // Gọi Service lấy dữ liệu học tập
        const result = await academicService.getAcademicSummary(studentId);

        // Kiểm tra cấu trúc dữ liệu trả về
        if (!result || !result.academic) {
            throw new Error("Không thể lấy dữ liệu GPA của sinh viên");
        }

        // Lấy thông tin GPA
        const gpaData = result.academic;

        // Trả về GPA cùng thông tin liên quan
        return res.status(200).json({
            success: true,
            message: "Lấy GPA thành công",
            data: {
                gpa: gpaData.gpa,
                gpaScale: gpaData.gpaScale,
                totalGPACredits: gpaData.totalGPACredits
            }
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 3. LẤY TÍN CHỈ TÍCH LŨY CỦA SINH VIÊN
// =====================================================

const getStudentCredits = async (req, res, next) => {
    try {
        // Lấy ID sinh viên từ URL
        const { studentId } = req.params;

        // Gọi Service lấy dữ liệu học tập
        const result = await academicService.getAcademicSummary(studentId);

        // Kiểm tra cấu trúc dữ liệu trả về
        if (!result || !result.academic) {
            throw new Error("Không thể lấy dữ liệu tín chỉ của sinh viên");
        }

        // Lấy thông tin tín chỉ
        const creditData = result.academic;

        // Trả về số tín chỉ đã tích lũy
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin tín chỉ thành công",
            data: {
                earnedCredits: creditData.earnedCredits,
                passedSubjects: creditData.passedSubjects,
                failedSubjects: creditData.failedSubjects
            }
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 4. LẤY KẾT QUẢ HỌC TẬP THEO HỌC KỲ
// =====================================================

const getStudentSemesterResults = async (req, res, next) => {
    try {
        // Lấy ID sinh viên và ID học kỳ từ URL
        const { studentId, semesterId } = req.params;

        // Gọi Service lấy kết quả học kỳ
        const result = await academicService.getSemesterResults(
            studentId,
            semesterId
        );

        return res.status(200).json({
            success: true,
            message: "Lấy kết quả học kỳ thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 5. LẤY LỊCH SỬ HỌC LẠI CỦA MÔN HỌC
// =====================================================

const getStudentSubjectHistory = async (req, res, next) => {
    try {
        // Lấy ID sinh viên và ID môn học từ URL
        const { studentId, subjectId } = req.params;

        // Gọi Service lấy lịch sử học lại
        const result = await academicService.getRetakeHistory(
            studentId,
            subjectId
        );

        return res.status(200).json({
            success: true,
            message: "Lấy lịch sử học lại thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 6. LẤY TIẾN ĐỘ CHƯƠNG TRÌNH ĐÀO TẠO
// =====================================================

const getStudentStudyProgress = async (req, res, next) => {
    try {
        // Lấy ID sinh viên từ URL
        const { studentId } = req.params;

        // Gọi Service tính toán tiến độ đào tạo
        const result = await academicService.getStudyProgress(studentId);

        return res.status(200).json({
            success: true,
            message: "Lấy tiến độ đào tạo thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 7. KIEM TRA DIEU KIEN THUC TAP
// =====================================================

const getInternshipEligibility = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const result = await academicService.checkInternshipEligibility(
            studentId
        );

        return res.status(200).json({
            success: true,
            message: "Kiem tra dieu kien thuc tap thanh cong",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 8. KIEM TRA DIEU KIEN LAM DO AN TOT NGHIEP
// =====================================================

const getGraduationProjectEligibility = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const result = await academicService.checkGraduationProjectEligibility(
            studentId
        );

        return res.status(200).json({
            success: true,
            message: "Kiem tra dieu kien lam do an tot nghiep thanh cong",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 9. TẠO KẾT QUẢ HỌC TẬP
// =====================================================

const createAcademicRecord = async (req, res, next) => {
    try {
        const result = await academicService.createAcademicRecord(
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Nhập kết quả học tập thành công",
            data: result
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORT CONTROLLER
// =====================================================


module.exports = {
    getStudentSummary,
    getStudentGPA,
    getStudentCredits,
    getStudentSemesterResults,
    getStudentSubjectHistory,
    getStudentStudyProgress,
    getInternshipEligibility,
    getGraduationProjectEligibility,
    createAcademicRecord
};

