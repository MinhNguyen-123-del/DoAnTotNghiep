const studentSemesterProgressService = require(
    "./student-semester-progress.service"
);

// =====================================================
// 1. LUU TIEN DO HOC KY
// =====================================================

const saveStudentSemesterProgress = async (req, res, next) => {
    try {
        const progress = await studentSemesterProgressService.saveStudentSemesterProgress(
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Luu tien do hoc ky thanh cong",
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 2. LAY TIEN DO HOC KY
// =====================================================

const getStudentSemesterProgresses = async (req, res, next) => {
    try {
        const progresses = await studentSemesterProgressService.getStudentSemesterProgresses(
            req.params.studentId
        );

        return res.status(200).json({
            success: true,
            data: progresses
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    saveStudentSemesterProgress,
    getStudentSemesterProgresses
};
