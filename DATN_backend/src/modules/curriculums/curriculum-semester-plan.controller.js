
const semesterPlanService = require(
    "./curriculum-semester-plan.service"
);

// Admin thêm hoặc cập nhật kế hoạch tín chỉ
const saveSemesterPlan = async (req, res, next) => {
    try {
        const result = await semesterPlanService.saveSemesterPlan(
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Lưu kế hoạch tín chỉ thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Xem danh sách kế hoạch tín chỉ
const getSemesterPlans = async (req, res, next) => {
    try {
        const { curriculumVersionId } = req.params;

        const plans = await semesterPlanService.getSemesterPlans(
            curriculumVersionId
        );

        return res.status(200).json({
            success: true,
            message: "Lấy kế hoạch tín chỉ thành công",
            total: plans.length,
            data: plans
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    saveSemesterPlan,
    getSemesterPlans
};
