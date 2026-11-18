
const StudentProfile = require("./student-profile.model");

const Curriculum = require("../curriculums/curriculum.model");
const CurriculumVersion = require("../curriculums/curriculum-version.model");

const User = require("../users/user.model");

// Tạo hồ sơ sinh viên
const createStudent = async (data) => {
    const {
        user,
        studentCode,
        fullName,
        cohort,
        admissionYear,
        curriculum,
        curriculumVersion
    } = data;

    // Kiểm tra tài khoản
    const existingUser = await User.findById(user);

    if (!existingUser) {
        throw new Error("Tài khoản người dùng không tồn tại");
    }

    // Kiểm tra mã sinh viên
    const existingStudent = await StudentProfile.findOne({
        studentCode
    });

    if (existingStudent) {
        throw new Error("Mã sinh viên đã tồn tại");
    }

    // Kiểm tra chương trình đào tạo
    const existingCurriculum = await Curriculum.findById(curriculum);

    if (!existingCurriculum) {
        throw new Error("Chương trình đào tạo không tồn tại");
    }

    // Kiểm tra phiên bản chương trình
    const version = await CurriculumVersion.findById(curriculumVersion);

    if (!version) {
        throw new Error("Phiên bản chương trình không tồn tại");
    }

    if (String(version.curriculum) !== String(curriculum)) {
        throw new Error("Phiên bản không thuộc chương trình đào tạo");
    }

    // Tạo hồ sơ
    return StudentProfile.create({
        ...data,
        studentCode,
        fullName,
        cohort,
        admissionYear,
        curriculum,
        curriculumVersion
    });
};

module.exports = {
    createStudent
};
