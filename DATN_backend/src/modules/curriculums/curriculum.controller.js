const curriculumService = require("./curriculum.service");

// =====================================================
// 1. HAM HO TRO TRA PHAN HOI
// =====================================================

const sendResponse = (res, statusCode, data) => {
    return res.status(statusCode).json({
        success: true,
        data
    });
};

// =====================================================
// 2. KHOA
// =====================================================

const getFaculties = async (req, res, next) => {
    try {
        const faculties = await curriculumService.getFaculties();

        return sendResponse(res, 200, faculties);
    } catch (error) {
        next(error);
    }
};

const createFaculty = async (req, res, next) => {
    try {
        const faculty = await curriculumService.createFaculty(req.body);

        return sendResponse(res, 201, faculty);
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 3. NGANH HOC
// =====================================================

const getMajors = async (req, res, next) => {
    try {
        const majors = await curriculumService.getMajors(req.query.faculty);

        return sendResponse(res, 200, majors);
    } catch (error) {
        next(error);
    }
};

const createMajor = async (req, res, next) => {
    try {
        const major = await curriculumService.createMajor(req.body);

        return sendResponse(res, 201, major);
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 4. MON HOC
// =====================================================

const getSubjects = async (req, res, next) => {
    try {
        const subjects = await curriculumService.getSubjects();

        return sendResponse(res, 200, subjects);
    } catch (error) {
        next(error);
    }
};

const createSubject = async (req, res, next) => {
    try {
        const subject = await curriculumService.createSubject(req.body);

        return sendResponse(res, 201, subject);
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 5. CHUONG TRINH DAO TAO
// =====================================================

const getCurriculums = async (req, res, next) => {
    try {
        const curriculums = await curriculumService.getCurriculums();

        return sendResponse(res, 200, curriculums);
    } catch (error) {
        next(error);
    }
};

const createCurriculum = async (req, res, next) => {
    try {
        const curriculum = await curriculumService.createCurriculum(req.body);

        return sendResponse(res, 201, curriculum);
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 6. PHIEN BAN CHUONG TRINH
// =====================================================

const getCurriculumVersions = async (req, res, next) => {
    try {
        const versions = await curriculumService.getCurriculumVersions(
            req.query.curriculum
        );

        return sendResponse(res, 200, versions);
    } catch (error) {
        next(error);
    }
};

const createCurriculumVersion = async (req, res, next) => {
    try {
        const version = await curriculumService.createCurriculumVersion(
            req.body
        );

        return sendResponse(res, 201, version);
    } catch (error) {
        next(error);
    }
};

const getCurriculumVersionDetail = async (req, res, next) => {
    try {
        const version = await curriculumService.getCurriculumVersionDetail(
            req.params.versionId
        );

        return sendResponse(res, 200, version);
    } catch (error) {
        next(error);
    }
};

// =====================================================
// 7. MON HOC VA TIEN QUYET CUA PHIEN BAN
// =====================================================

const addSubjectToCurriculumVersion = async (req, res, next) => {
    try {
        const curriculumSubject = await curriculumService.addSubjectToCurriculumVersion(
            req.params.versionId,
            req.body
        );

        return sendResponse(res, 201, curriculumSubject);
    } catch (error) {
        next(error);
    }
};

const addPrerequisite = async (req, res, next) => {
    try {
        const prerequisite = await curriculumService.addPrerequisite(
            req.params.versionId,
            req.body
        );

        return sendResponse(res, 201, prerequisite);
    } catch (error) {
        next(error);
    }
};

const removePrerequisite = async (req, res, next) => {
    try {
        await curriculumService.removePrerequisite(
            req.params.versionId,
            req.params.prerequisiteId
        );

        return res.status(204).end();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getFaculties,
    createFaculty,
    getMajors,
    createMajor,
    getSubjects,
    createSubject,
    getCurriculums,
    createCurriculum,
    getCurriculumVersions,
    createCurriculumVersion,
    getCurriculumVersionDetail,
    addSubjectToCurriculumVersion,
    addPrerequisite,
    removePrerequisite
};
