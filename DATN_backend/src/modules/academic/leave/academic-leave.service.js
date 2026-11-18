
const mongoose = require("mongoose");

const AcademicLeave = require("./academic-leave.model");
const StudentProfile = require("../../students/student-profile.model");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateId = (id, fieldName = "ID") => {
    if (!mongoose.isValidObjectId(id)) {
        throw createError(`${fieldName} không hợp lệ`);
    }
};

const parseDate = (value, fieldName) => {
    const date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) {
        throw createError(`${fieldName} không hợp lệ`);
    }

    return date;
};

// Kiểm tra một hồ sơ có đang có hiệu lực hay không
const isLeaveActive = (leave, now = new Date()) => {
    return (
        leave.status === "approved" &&
        new Date(leave.startDate) <= now &&
        now < new Date(leave.endDate)
    );
};

// Tạo hồ sơ bảo lưu
const createAcademicLeave = async (data, adminId) => {
    const {
        student,
        startDate,
        endDate,
        reason,
        note = ""
    } = data;

    validateId(student, "Student ID");

    if (adminId != null) {
        validateId(adminId, "Admin ID");
    }

    if (typeof reason !== "string" || !reason.trim()) {
        throw createError("Lý do bảo lưu không được để trống");
    }

    const start = parseDate(startDate, "Ngày bắt đầu");
    const end = parseDate(endDate, "Ngày kết thúc");

    if (end <= start) {
        throw createError(
            "Ngày kết thúc phải sau ngày bắt đầu"
        );
    }

    const studentProfile = await StudentProfile.findById(student);

    if (!studentProfile) {
        throw createError("Không tìm thấy sinh viên", 404);
    }

    if (
        ["graduated", "withdrawn"].includes(
            studentProfile.academicStatus
        )
    ) {
        throw createError(
            "Sinh viên đã tốt nghiệp hoặc thôi học không thể tạo bảo lưu"
        );
    }

    // Kiểm tra khoảng thời gian bảo lưu chồng lấn
    const overlappingLeave = await AcademicLeave.findOne({
        student,
        status: "approved",
        startDate: { $lt: end },
        endDate: { $gt: start }
    });

    if (overlappingLeave) {
        throw createError(
            "Thời gian bảo lưu trùng với một hồ sơ đã duyệt",
            409
        );
    }

    const leave = await AcademicLeave.create({
        student,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        note,
        approvedBy: adminId || null,
        status: "approved"
    });

    // Chỉ đổi trạng thái nếu bảo lưu đang có hiệu lực
    // và sinh viên hiện đang ở trạng thái studying.
    if (
        isLeaveActive(leave) &&
        studentProfile.academicStatus === "studying"
    ) {
        await StudentProfile.updateOne(
            {
                _id: student,
                academicStatus: "studying"
            },
            {
                $set: { academicStatus: "reserved" }
            }
        );
    }

    return leave;
};

// Lấy lịch sử bảo lưu của sinh viên
const getStudentAcademicLeaves = async (studentId) => {
    validateId(studentId, "Student ID");

    const student = await StudentProfile.findById(studentId);

    if (!student) {
        throw createError("Không tìm thấy sinh viên", 404);
    }

    const leaves = await AcademicLeave.find({
        student: studentId
    })
        .populate("approvedBy", "email role")
        .sort({ startDate: -1 })
        .lean();

    const now = new Date();

    return {
        student: {
            id: student._id,
            studentCode: student.studentCode,
            fullName: student.fullName,
            academicStatus: student.academicStatus
        },
        total: leaves.length,
        leaves: leaves.map(leave => ({
            ...leave,
            isActive: isLeaveActive(leave, now)
        }))
    };
};

// Hủy một hồ sơ bảo lưu
const cancelAcademicLeave = async (leaveId) => {
    validateId(leaveId, "Leave ID");

    const leave = await AcademicLeave.findById(leaveId);

    if (!leave) {
        throw createError("Không tìm thấy hồ sơ bảo lưu", 404);
    }

    if (leave.status === "cancelled") {
        throw createError(
            "Hồ sơ bảo lưu đã được hủy",
            409
        );
    }

    leave.status = "cancelled";
    await leave.save();

    // Kiểm tra còn đợt bảo lưu nào đang có hiệu lực không
    const now = new Date();

    const anotherActiveLeave = await AcademicLeave.exists({
        student: leave.student,
        status: "approved",
        startDate: { $lte: now },
        endDate: { $gt: now }
    });

    if (!anotherActiveLeave) {
        await StudentProfile.updateOne(
            {
                _id: leave.student,
                academicStatus: "reserved"
            },
            {
                $set: { academicStatus: "studying" }
            }
        );
    }

    return leave;
};

// Tính tổng số ngày bảo lưu đã được duyệt
// Gộp khoảng thời gian để tránh cộng trùng
const calculateLeaveDays = async (
    studentId,
    untilDate = new Date()
) => {
    validateId(studentId, "Student ID");

    const until = parseDate(untilDate, "Ngày tính");

    const leaves = await AcademicLeave.find({
        student: studentId,
        status: "approved",
        startDate: { $lt: until }
    })
        .sort({ startDate: 1 })
        .lean();

    const intervals = leaves
        .map(leave => ({
            start: new Date(leave.startDate).getTime(),
            end: Math.min(
                new Date(leave.endDate).getTime(),
                until.getTime()
            )
        }))
        .filter(item => item.end > item.start);

    let totalMilliseconds = 0;
    let currentStart = null;
    let currentEnd = null;

    for (const interval of intervals) {
        if (currentStart === null) {
            currentStart = interval.start;
            currentEnd = interval.end;
        } else if (interval.start <= currentEnd) {
            currentEnd = Math.max(currentEnd, interval.end);
        } else {
            totalMilliseconds += currentEnd - currentStart;
            currentStart = interval.start;
            currentEnd = interval.end;
        }
    }

    if (currentStart !== null) {
        totalMilliseconds += currentEnd - currentStart;
    }

    return Math.floor(
        totalMilliseconds / (24 * 60 * 60 * 1000)
    );
};

module.exports = {
    createAcademicLeave,
    getStudentAcademicLeaves,
    cancelAcademicLeave,
    calculateLeaveDays,
    isLeaveActive
};
