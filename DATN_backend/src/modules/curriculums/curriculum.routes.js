const express = require("express");

const curriculumController = require("./curriculum.controller");

const router = express.Router();

router.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Curriculums API is running"
    });
});

// =====================================================
// 1. KHOA, NGANH VA MON HOC
// =====================================================

router
    .route("/faculties")
    .get(curriculumController.getFaculties)
    .post(curriculumController.createFaculty);

router
    .route("/majors")
    .get(curriculumController.getMajors)
    .post(curriculumController.createMajor);

router
    .route("/subjects")
    .get(curriculumController.getSubjects)
    .post(curriculumController.createSubject);

// =====================================================
// 2. CHUONG TRINH VA PHIEN BAN
// =====================================================

router
    .route("/")
    .get(curriculumController.getCurriculums)
    .post(curriculumController.createCurriculum);

router
    .route("/versions")
    .get(curriculumController.getCurriculumVersions)
    .post(curriculumController.createCurriculumVersion);

router.get(
    "/versions/:versionId",
    curriculumController.getCurriculumVersionDetail
);

// =====================================================
// 3. QUY TAC CUA PHIEN BAN
// =====================================================

router.post(
    "/versions/:versionId/subjects",
    curriculumController.addSubjectToCurriculumVersion
);

router.post(
    "/versions/:versionId/prerequisites",
    curriculumController.addPrerequisite
);

router.delete(
    "/versions/:versionId/prerequisites/:prerequisiteId",
    curriculumController.removePrerequisite
);

module.exports = router;
