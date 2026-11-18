const academicLeaveService = require(
    "./academic-leave.service"
);

// =====================================================
// 1. TAO HO SO BAO LUU
// =====================================================

const createAcademicLeave = async (req, res, next) => {
    try {
        const leave = await academicLeaveService.createAcademicLeave(
            req.body,
            req.user.userId
        );

        return res.status(201).json({
            success: true,
            message: "Tao ho so bao luu thanh cong",
            data: leave
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 2. LAY LICH SU BAO LUU CUA SINH VIEN
// =====================================================

const getStudentAcademicLeaves = async (req, res, next) => {
    try {
        const result = await academicLeaveService.getStudentAcademicLeaves(
            req.params.studentId
        );

        return res.status(200).json({
            success: true,
            message: "Lay lich su bao luu thanh cong",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 3. HUY HO SO BAO LUU
// =====================================================

const cancelAcademicLeave = async (req, res, next) => {
    try {
        const leave = await academicLeaveService.cancelAcademicLeave(
            req.params.leaveId
        );

        return res.status(200).json({
            success: true,
            message: "Huy ho so bao luu thanh cong",
            data: leave
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createAcademicLeave,
    getStudentAcademicLeaves,
    cancelAcademicLeave
};
