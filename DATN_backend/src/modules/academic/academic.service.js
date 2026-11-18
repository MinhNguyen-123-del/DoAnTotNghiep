
const mongoose = require("mongoose");
// Import Model User để Mongoose có thể populate trường user
const User = require("../users/user.model");
const StudentProfile = require("../students/student-profile.model");
const AcademicRecord = require("./models/academic-record.model");
const Semester = require("./models/semester.model");
const Subject = require("./models/subject.model");
const Curriculum = require("../curriculums/curriculum.model");
const CurriculumVersion = require("../curriculums/curriculum-version.model");
const CurriculumSubject = require("../curriculums/curriculum-subject.model");
const AcademicLeave = require("./leave/academic-leave.model");
// =====================================================
// 1. KIỂM TRA ID
// =====================================================

const validateObjectId = (id, fieldName = "ID") => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`${fieldName} không hợp lệ`);
    }
};

// =====================================================
// 2. LẤY HỒ SƠ SINH VIÊN
// =====================================================

const getStudentProfile = async (studentId) => {
    validateObjectId(studentId, "Student ID");

    const student = await StudentProfile.findById(studentId)
        .populate("user", "email role status")
        .populate("curriculum");

    if (!student) {
        throw new Error("Không tìm thấy hồ sơ sinh viên");
    }

    return student;
};

// =====================================================
// 3. LẤY KẾT QUẢ ĐÃ XÁC NHẬN
// =====================================================

const getConfirmedRecords = async (studentId) => {
    validateObjectId(studentId, "Student ID");

    return await AcademicRecord.find({
        student: studentId,
        status: "confirmed"
    })
        .populate("subject")
        .populate("semester")
        .sort({
            attemptNumber: -1,
            confirmedAt: -1,
            createdAt: -1
        })
        .lean();
};

// =====================================================
// 4. LẤY LẦN HỌC MỚI NHẤT CỦA TỪNG MÔN
// =====================================================


const getLatestAttempts = (records) => {
    const latestRecords = new Map();

    for (const record of records) {
        const subjectId =
            record.subject?._id?.toString() ||
            record.subject?.toString();

        if (!subjectId) continue;

        const existing = latestRecords.get(subjectId);

        const currentAttempt = Number(record.attemptNumber || 0);
        const existingAttempt = Number(existing?.attemptNumber || 0);

        const currentDate = new Date(
            record.confirmedAt || record.createdAt || 0
        ).getTime();

        const existingDate = existing
            ? new Date(
                existing.confirmedAt || existing.createdAt || 0
            ).getTime()
            : 0;

        if (
            !existing ||
            currentAttempt > existingAttempt ||
            (
                currentAttempt === existingAttempt &&
                currentDate > existingDate
            )
        ) {
            latestRecords.set(subjectId, record);
        }
    }

    return Array.from(latestRecords.values());
};


// =====================================================
// 5. TÍNH GPA TÍCH LŨY
// =====================================================

const calculateGPA = (records) => {
    // Chỉ lấy lần học mới nhất của từng môn
    const latestRecords = getLatestAttempts(records);

    // Chỉ tính những môn được tính GPA và có dữ liệu hợp lệ
    const gpaRecords = latestRecords.filter((record) => {
        const gradePoint = Number(record.gradePoint4);
        const credits = Number(record.creditsSnapshot);

        return (
            record.includedInGPA === true &&
            record.gradePoint4 !== null &&
            record.gradePoint4 !== undefined &&
            Number.isFinite(gradePoint) &&
            gradePoint >= 0 &&
            gradePoint <= 4 &&
            Number.isFinite(credits) &&
            credits > 0
        );
    });

    // Tổng điểm quy đổi có trọng số tín chỉ
    const totalWeightedPoints = gpaRecords.reduce(
        (total, record) => {
            return (
                total +
                Number(record.gradePoint4) *
                Number(record.creditsSnapshot)
            );
        },
        0
    );

    // Tổng số tín chỉ được dùng để tính GPA
    const totalGPACredits = gpaRecords.reduce(
        (total, record) => {
            return total + Number(record.creditsSnapshot);
        },
        0
    );

    // GPA = Tổng (điểm hệ 4 × tín chỉ) / Tổng tín chỉ
    const gpa =
        totalGPACredits > 0
            ? totalWeightedPoints / totalGPACredits
            : null;

    return {
        gpa: gpa === null ? null : Number(gpa.toFixed(2)),
        totalGPACredits,
        totalSubjects: gpaRecords.length
    };
};

// =====================================================
// 6. TÍNH TÍN CHỈ TÍCH LŨY
// =====================================================

const calculateEarnedCredits = (records) => {
    // Chỉ lấy lần học mới nhất của từng môn
    const latestRecords = getLatestAttempts(records);

    // Chỉ tính các môn đã đạt và có số tín chỉ hợp lệ
    const passedRecords = latestRecords.filter((record) => {
        const credits = Number(record.creditsSnapshot);

        return (
            record.isPassed === true &&
            Number.isFinite(credits) &&
            credits > 0
        );
    });

    // Tổng tín chỉ của các môn đã đạt
    const earnedCredits = passedRecords.reduce(
        (total, record) => {
            return total + Number(record.creditsSnapshot);
        },
        0
    );

    // Đếm số môn chưa đạt
    const failedRecords = latestRecords.filter(
        (record) => record.isPassed === false
    );

    return {
        earnedCredits,
        passedSubjects: passedRecords.length,
        failedSubjects: failedRecords.length
    };
};

// =====================================================
// 7. TỔNG QUAN KẾT QUẢ HỌC TẬP
// =====================================================

const getAcademicSummary = async (studentId) => {
    const student = await getStudentProfile(studentId);

    const records = await getConfirmedRecords(studentId);

    const gpaData = calculateGPA(records);
    const creditData = calculateEarnedCredits(records);

    return {
        student: {
            id: student._id,
            studentCode: student.studentCode,
            fullName: student.fullName,
            major: student.major,
            cohort: student.cohort
        },

        academic: {
            gpa: gpaData.gpa,
            gpaScale: 4,
            totalGPACredits: gpaData.totalGPACredits,

            earnedCredits: creditData.earnedCredits,

            passedSubjects: creditData.passedSubjects,
            failedSubjects: creditData.failedSubjects,

            totalConfirmedRecords: records.length
        }
    };
};

// =====================================================
// 8. KẾT QUẢ HỌC TẬP THEO HỌC KỲ
// =====================================================

const getSemesterResults = async (studentId, semesterId) => {
    validateObjectId(studentId, "Student ID");
    validateObjectId(semesterId, "Semester ID");

    const semester = await Semester.findById(semesterId);

    if (!semester) {
        throw new Error("Không tìm thấy học kỳ");
    }

    const records = await AcademicRecord.find({
        student: studentId,
        semester: semesterId,
        status: "confirmed"
    })
        .populate("subject")
        .sort({
            attemptNumber: -1,
            confirmedAt: -1
        })
        .lean();

    const latestRecords = getLatestAttempts(records);

    const gpaData = calculateGPA(latestRecords);
    const creditData = calculateEarnedCredits(latestRecords);

    return {
        semester: {
            id: semester._id,
            semesterCode: semester.semesterCode,
            semesterName: semester.semesterName,
            academicYear: semester.academicYear
        },

        results: latestRecords,

        summary: {
            semesterGPA: gpaData.gpa,
            gpaCredits: gpaData.totalGPACredits,
            earnedCredits: creditData.earnedCredits,
            passedSubjects: creditData.passedSubjects,
            failedSubjects: creditData.failedSubjects
        }
    };
};

// =====================================================
// 9. LỊCH SỬ HỌC LẠI
// =====================================================

const getRetakeHistory = async (studentId, subjectId) => {
    // Kiểm tra định dạng ID trước khi truy vấn
    validateObjectId(studentId, "Student ID");
    validateObjectId(subjectId, "Subject ID");

    // Chỉ lấy các lần học đã được xác nhận
    const records = await AcademicRecord.find({
        student: studentId,
        subject: subjectId,
        status: "confirmed"
    })
        .populate("subject")
        .populate("semester")
        .sort({
            attemptNumber: 1,
            confirmedAt: 1,
            createdAt: 1
        })
        .lean();

    return {
        // Thông tin môn học
        subject: records[0]?.subject || null,

        // Tổng số lần học đã xác nhận
        totalAttempts: records.length,

        // Danh sách lịch sử theo thứ tự lần học tăng dần
        history: records
    };
};

// =====================================================
// 10. TIẾN ĐỘ CHƯƠNG TRÌNH ĐÀO TẠO
// =====================================================


const getStudyProgress = async (studentId) => {
    const curriculumData = await getStudentCurriculumData(studentId);

    const records = await getConfirmedRecords(studentId);
    const recordsBySubject = getLatestRecordsBySubject(records);

    const creditDetails = calculateCurriculumCreditDetails(
        curriculumData.curriculumSubjects,
        recordsBySubject
    );

    const totalCreditsRequired =
        curriculumData.totalCreditsRequired;

    const earnedCredits = creditDetails.earnedCredits;

    const remainingCredits = Math.max(
        totalCreditsRequired - earnedCredits,
        0
    );

    const progressPercentage = totalCreditsRequired > 0
        ? Number(
            Math.min(
                (earnedCredits / totalCreditsRequired) * 100,
                100
            ).toFixed(2)
        )
        : 0;

    // Các môn bắt buộc chưa hoàn thành
    const outstandingRequiredSubjects =
        curriculumData.curriculumSubjects
            .filter(item => item.isRequired === true)
            .filter(item => {
                const subjectId =
                    item.subject?._id?.toString() ||
                    item.subject?.toString();

                return recordsBySubject.get(subjectId)?.isPassed !== true;
            })
            .map(item => ({
                subjectCode: item.subject?.subjectCode || null,
                subjectName: item.subject?.subjectName || null,
                credits: Number(item.credits) || 0,
                recommendedSemester: item.recommendedSemester
            }));

    return {
        curriculum: {
            id: curriculumData.curriculum._id,
            curriculumCode: curriculumData.curriculum.curriculumCode,
            name: curriculumData.curriculum.name,
            totalCreditsRequired,

            version: curriculumData.curriculumVersion
                ? {
                    id: curriculumData.curriculumVersion._id,
                    versionCode:
                        curriculumData.curriculumVersion.versionCode,
                    cohort: curriculumData.curriculumVersion.cohort
                }
                : null
        },

        progress: {
            earnedCredits,
            remainingCredits,
            progressPercentage,

            completedSubjects: creditDetails.completedSubjects,
            totalSubjects: curriculumData.curriculumSubjects.length,

            required: {
                totalCredits: creditDetails.requiredCredits,
                earnedCredits: creditDetails.requiredEarnedCredits,
                completedSubjects:
                    creditDetails.completedRequiredSubjects
            },

            elective: {
                requiredCredits:
                    creditDetails.electiveRequiredCredits,
                earnedCredits:
                    creditDetails.electiveEarnedCredits,
                countedCredits:
                    creditDetails.countedElectiveCredits,
                completedSubjects:
                    creditDetails.completedElectiveSubjects
            },

            outstandingRequiredSubjects
        }
    };
};


// =====================================================
// 11. LAY DU LIEU CHUONG TRINH AP DUNG CHO SINH VIEN
// =====================================================

const getStudentCurriculumData = async (studentId) => {
    const student = await getStudentProfile(studentId);

    if (!student.curriculum && !student.curriculumVersion) {
        throw new Error(
            "Sinh vien chua duoc gan chuong trinh dao tao"
        );
    }

    const curriculumVersionId =
        student.curriculumVersion?._id || student.curriculumVersion || null;

    const curriculumId =
        student.curriculum?._id || student.curriculum || null;

    const curriculumVersion = curriculumVersionId
        ? await CurriculumVersion.findById(curriculumVersionId)
        : null;

    if (curriculumVersionId && !curriculumVersion) {
        throw new Error("Khong tim thay phien ban chuong trinh dao tao");
    }

    const curriculum = await Curriculum.findById(
        curriculumVersion ? curriculumVersion.curriculum : curriculumId
    );

    if (!curriculum) {
        throw new Error("Khong tim thay chuong trinh dao tao");
    }

    const subjectFilter = curriculumVersion
        ? { curriculumVersion: curriculumVersion._id }
        : { curriculum: curriculumId, curriculumVersion: null };

    const curriculumSubjects = await CurriculumSubject.find(subjectFilter)
        .populate("subject", "subjectCode subjectName")
        .lean();

    const totalCreditsRequired = Number(
        curriculumVersion
            ? curriculumVersion.totalCreditsRequired
            : curriculum.totalCreditsRequired
    );

    if (!Number.isFinite(totalCreditsRequired) || totalCreditsRequired < 0) {
        throw new Error("Tong so tin chi yeu cau cua chuong trinh khong hop le");
    }

    return {
        student,
        curriculum,
        curriculumVersion,
        curriculumSubjects,
        totalCreditsRequired
    };
};

const getLatestRecordsBySubject = (records) => {
    const latestRecords = getLatestAttempts(records);
    const recordsBySubject = new Map();

    for (const record of latestRecords) {
        const subjectId = record.subject?._id?.toString() || record.subject?.toString();

        if (subjectId) {
            recordsBySubject.set(subjectId, record);
        }
    }

    return recordsBySubject;
};


const calculateCurriculumCreditDetails = (
    curriculumSubjects,
    recordsBySubject
) => {
    let requiredEarnedCredits = 0;
    let electiveEarnedCredits = 0;
    let completedRequiredSubjects = 0;
    let completedElectiveSubjects = 0;

    const requiredCredits = curriculumSubjects
        .filter(item => item.isRequired === true)
        .reduce(
            (total, item) => total + Number(item.credits || 0),
            0
        );

    // CTĐT K20 hiện tại có 15 tín chỉ tự chọn yêu cầu.
    // Tạm tính bằng tổng các môn tự chọn đã cấu hình.
    const electiveRequiredCredits = curriculumSubjects
        .filter(item => item.isRequired === false)
        .reduce(
            (total, item) => total + Number(item.credits || 0),
            0
        );

    for (const item of curriculumSubjects) {
        const subjectId =
            item.subject?._id?.toString() ||
            item.subject?.toString();

        if (!subjectId) continue;

        const record = recordsBySubject.get(subjectId);

        if (record?.isPassed !== true) continue;

        const credits = Number(item.credits);

        if (!Number.isFinite(credits) || credits <= 0) continue;

        if (item.isRequired === true) {
            requiredEarnedCredits += credits;
            completedRequiredSubjects++;
        } else {
            electiveEarnedCredits += credits;
            completedElectiveSubjects++;
        }
    }

    const countedElectiveCredits = Math.min(
        electiveEarnedCredits,
        electiveRequiredCredits
    );

    const earnedCredits =
        requiredEarnedCredits + countedElectiveCredits;

    return {
        earnedCredits,
        requiredCredits,
        requiredEarnedCredits,
        electiveRequiredCredits,
        electiveEarnedCredits,
        countedElectiveCredits,
        completedRequiredSubjects,
        completedElectiveSubjects,
        completedSubjects:
            completedRequiredSubjects + completedElectiveSubjects
    };
};

// Giữ tương thích với các hàm đang gọi helper cũ
const calculateCurriculumEarnedCredits = (
    curriculumSubjects,
    recordsBySubject
) => {
    return calculateCurriculumCreditDetails(
        curriculumSubjects,
        recordsBySubject
    ).earnedCredits;
};



const getAcademicYearStart = (date = new Date()) => {
    const year = date.getFullYear();

    // Năm học bắt đầu tháng 9
    return date.getMonth() >= 8 ? year : year - 1;
};

// Tính năm học thực tế sau khi trừ các năm bảo lưu
const getActualStudyYear = async (
    studentId,
    admissionYear,
    now = new Date()
) => {
    const year = Number(admissionYear);

    if (!Number.isInteger(year) || year < 1900) {
        throw new Error("Năm nhập học không hợp lệ");
    }

    const currentAcademicYear = getAcademicYearStart(now);

    const nominalStudyYear = Math.max(
        currentAcademicYear - year + 1,
        0
    );

    const leaves = await AcademicLeave.find({
        student: studentId,
        status: "approved",
        startDate: { $lt: now }
    }).lean();

    // Mỗi năm học được tính là bảo lưu trọn năm
    // nếu khoảng bảo lưu bao phủ toàn bộ năm học đó.
    let reservedAcademicYears = 0;

    for (
        let academicYear = year;
        academicYear <= currentAcademicYear;
        academicYear++
    ) {
        const academicYearStart = new Date(
            academicYear, 8, 1
        );

        const academicYearEnd = new Date(
            academicYear + 1, 8, 1
        );

        const fullyReserved = leaves.some(leave => {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);

            return (
                leaveStart <= academicYearStart &&
                leaveEnd >= academicYearEnd
            );
        });

        if (fullyReserved) {
            reservedAcademicYears++;
        }
    }

    const actualStudyYear = Math.max(
        nominalStudyYear - reservedAcademicYears,
        0
    );

    return {
        nominalStudyYear,
        reservedAcademicYears,
        actualStudyYear
    };
};


// =====================================================
// 12. KIEM TRA DIEU KIEN THUC TAP
// =====================================================


const checkInternshipEligibility = async (studentId) => {
    const curriculumData = await getStudentCurriculumData(studentId);

    const records = await getConfirmedRecords(studentId);
    const recordsBySubject = getLatestRecordsBySubject(records);

    const creditDetails = calculateCurriculumCreditDetails(
        curriculumData.curriculumSubjects,
        recordsBySubject
    );

    const earnedCredits = creditDetails.earnedCredits;
    const totalCreditsRequired = curriculumData.totalCreditsRequired;

    // 1. Kiem tra nam hoc thuc te sau khi tru bao luu
    const admissionYear = curriculumData.student.admissionYear;

    const studyYearData = await getActualStudyYear(
        studentId,
        admissionYear
    );

    const currentStudyYear = studyYearData.actualStudyYear;

    const isFourthYearOrAbove = currentStudyYear >= 4;

    // Chi xet dieu kien khi sinh vien dang hoc.
    const isStudying =
        curriculumData.student.academicStatus === "studying";

    // 2. Kiem tra 80% tin chi
    const requiredCredits = Math.ceil(totalCreditsRequired * 0.8);

    const hasEnoughCredits = earnedCredits >= requiredCredits;

    const creditPercentage = totalCreditsRequired > 0
        ? Number(
            ((earnedCredits / totalCreditsRequired) * 100).toFixed(2)
        )
        : 0;

    // 3. Phai thoa man dong thoi tat ca dieu kien
    const eligible =
        isStudying &&
        isFourthYearOrAbove &&
        hasEnoughCredits;

    return {
        eligible,

        rule: "studying_fourth_year_and_80_percent_credits",

        studyYear: {
            admissionYear,
            nominalStudyYear: studyYearData.nominalStudyYear,
            reservedAcademicYears: studyYearData.reservedAcademicYears,
            currentStudyYear,
            isFourthYearOrAbove,
            isStudying
        },

        credits: {
            earnedCredits,
            totalCreditsRequired,
            requiredCredits,
            creditPercentage,
            hasEnoughCredits,
            remainingCredits: Math.max(
                requiredCredits - earnedCredits,
                0
            )
        },

        reasons: [
            ...(!isStudying
                ? ["Sinh vien hien khong o trang thai dang hoc"]
                : []),

            ...(!isFourthYearOrAbove
                ? ["Sinh viên chưa đến năm học thứ 4"]
                : []),

            ...(!hasEnoughCredits
                ? [
                    `Chưa tích lũy đủ ${requiredCredits} tín chỉ để thực tập`
                ]
                : [])
        ]
    };
};


// =====================================================
// 13. KIEM TRA DIEU KIEN LAM DO AN TOT NGHIEP
// =====================================================


const checkGraduationProjectEligibility = async (studentId) => {
    const curriculumData = await getStudentCurriculumData(studentId);

    const records = await getConfirmedRecords(studentId);
    const recordsBySubject = getLatestRecordsBySubject(records);

    const curriculumSubjects = curriculumData.curriculumSubjects;

    // 1. Xác định môn khóa luận
    const graduationSubjects = curriculumSubjects.filter(
        item => item.requirementType === "graduation_project"
    );

    const graduationConfigured = graduationSubjects.length > 0;

    const graduationCredits = graduationSubjects.reduce(
        (total, item) => total + Number(item.credits || 0),
        0
    );

    // 2. Kiểm tra thực tập tốt nghiệp
    const internshipSubjects = curriculumSubjects.filter(
        item => item.requirementType === "internship"
    );

    const completedInternshipSubjects = internshipSubjects.filter(
        item => {
            const subjectId =
                item.subject?._id?.toString() ||
                item.subject?.toString();

            return recordsBySubject.get(subjectId)?.isPassed === true;
        }
    );

    const internshipConfigured = internshipSubjects.length > 0;

    const internshipCompleted =
        internshipConfigured &&
        completedInternshipSubjects.length === internshipSubjects.length;

    // 3. Danh sách môn bắt buộc chưa hoàn thành
    // Không tính môn khóa luận
    const outstandingRequiredSubjects = curriculumSubjects
        .filter(item =>
            item.isRequired === true &&
            item.requirementType !== "graduation_project"
        )
        .filter(item => {
            const subjectId =
                item.subject?._id?.toString() ||
                item.subject?.toString();

            return recordsBySubject.get(subjectId)?.isPassed !== true;
        })
        .map(item => ({
            id: item.subject?._id || item.subject,
            subjectCode: item.subject?.subjectCode || null,
            subjectName: item.subject?.subjectName || null,
            credits: Number(item.credits) || 0
        }));

    // 4. Tính tín chỉ đã tích lũy theo CTĐT
    const creditDetails = calculateCurriculumCreditDetails(
        curriculumSubjects,
        recordsBySubject
    );

    // Không tính tín chỉ khóa luận vào điều kiện bắt đầu làm khóa luận
    const completedGraduationCredits = graduationSubjects.reduce(
        (total, item) => {
            const subjectId =
                item.subject?._id?.toString() ||
                item.subject?.toString();

            const record = recordsBySubject.get(subjectId);

            return record?.isPassed === true
                ? total + Number(item.credits || 0)
                : total;
        },
        0
    );

    const earnedCreditsBeforeGraduation = Math.max(
        creditDetails.earnedCredits - completedGraduationCredits,
        0
    );

    const requiredCreditsBeforeGraduation = Math.max(
        curriculumData.totalCreditsRequired - graduationCredits,
        0
    );

    const creditsCompleted =
        earnedCreditsBeforeGraduation >= requiredCreditsBeforeGraduation;

    // 5. Kiểm tra tín chỉ tự chọn
    const electiveCompleted =
        creditDetails.countedElectiveCredits >=
        creditDetails.electiveRequiredCredits;

    // 6. Kiểm tra trạng thái học tập
    const isStudying =
        curriculumData.student.academicStatus === "studying";

    // 7. Kết luận
    const eligible =
        graduationConfigured &&
        internshipCompleted &&
        outstandingRequiredSubjects.length === 0 &&
        electiveCompleted &&
        creditsCompleted &&
        isStudying;

    return {
        eligible,

        graduationProject: {
            configured: graduationConfigured,
            totalSubjects: graduationSubjects.length,
            credits: graduationCredits
        },

        internship: {
            configured: internshipConfigured,
            completed: internshipCompleted,
            totalSubjects: internshipSubjects.length,
            completedSubjects: completedInternshipSubjects.length
        },

        requiredSubjects: {
            completed: outstandingRequiredSubjects.length === 0,
            outstanding: outstandingRequiredSubjects
        },

        elective: {
            completed: electiveCompleted,
            requiredCredits: creditDetails.electiveRequiredCredits,
            earnedCredits: creditDetails.countedElectiveCredits
        },

        credits: {
            completed: creditsCompleted,
            earnedCredits: earnedCreditsBeforeGraduation,
            requiredCredits: requiredCreditsBeforeGraduation,
            remainingCredits: Math.max(
                requiredCreditsBeforeGraduation -
                earnedCreditsBeforeGraduation,
                0
            )
        },

        academicStatus: curriculumData.student.academicStatus,

        reasons: [
            ...(!graduationConfigured
                ? ["Chưa cấu hình môn khóa luận tốt nghiệp"]
                : []),
            ...(!internshipCompleted
                ? ["Chưa hoàn thành thực tập tốt nghiệp"]
                : []),
            ...(outstandingRequiredSubjects.length > 0
                ? ["Còn học phần bắt buộc chưa hoàn thành"]
                : []),
            ...(!electiveCompleted
                ? ["Chưa hoàn thành đủ tín chỉ tự chọn"]
                : []),
            ...(!creditsCompleted
                ? ["Chưa tích lũy đủ tín chỉ trước khóa luận"]
                : []),
            ...(!isStudying
                ? ["Sinh viên không ở trạng thái đang học"]
                : [])
        ]
    };
};


 // =====================================================
 // 14. TẠO KẾT QUẢ HỌC TẬP CHO SINH VIÊN
 // =====================================================

const createAcademicRecord = async (data) => {
    const {
        student,
        subject,
        semester,
        attemptNumber = 1,
        finalScore10,
        gradePoint4,
        includedInGPA = true,
        isPassed
    } = data;

    // 1. Kiểm tra ID
    validateObjectId(student, "Student ID");
    validateObjectId(subject, "Subject ID");
    validateObjectId(semester, "Semester ID");

    // 2. Kiểm tra dữ liệu điểm
    if (
        typeof finalScore10 !== "number" ||
        finalScore10 < 0 ||
        finalScore10 > 10
    ) {
        throw new Error("Điểm hệ 10 phải từ 0 đến 10");
    }

    if (
        typeof gradePoint4 !== "number" ||
        gradePoint4 < 0 ||
        gradePoint4 > 4
    ) {
        throw new Error("Điểm hệ 4 phải từ 0 đến 4");
    }

    if (typeof isPassed !== "boolean") {
        throw new Error("isPassed phải là true hoặc false");
    }

    if (
        !Number.isInteger(attemptNumber) ||
        attemptNumber < 1
    ) {
        throw new Error("Số lần học phải là số nguyên dương");
    }

    if (typeof includedInGPA !== "boolean") {
        throw new Error("includedInGPA phải là boolean");
    }

    // 3. Kiểm tra hồ sơ và chương trình đào tạo
    const curriculumData = await getStudentCurriculumData(student);

    // 4. Kiểm tra môn học thuộc CTĐT của sinh viên
    const curriculumSubject = curriculumData.curriculumSubjects.find(
        (item) => {
            const subjectId =
                item.subject?._id?.toString() ||
                item.subject?.toString();

            return subjectId === subject.toString();
        }
    );

    if (!curriculumSubject) {
        throw new Error(
            "Môn học không thuộc chương trình đào tạo của sinh viên"
        );
    }

    // 5. Kiểm tra học kỳ tồn tại
    const existingSemester = await Semester.findById(semester);

    if (!existingSemester) {
        throw new Error("Không tìm thấy học kỳ");
    }

    // 6. Kiểm tra trùng lần học
    const existingRecord = await AcademicRecord.findOne({
        student,
        subject,
        attemptNumber
    });

    if (existingRecord) {
        throw new Error(
            "Kết quả học tập của lần học này đã tồn tại"
        );
    }

    // 7. Lấy tín chỉ từ chương trình đào tạo
    const creditsSnapshot = Number(curriculumSubject.credits);

    if (!Number.isFinite(creditsSnapshot) || creditsSnapshot <= 0) {
        throw new Error("Số tín chỉ của môn học không hợp lệ");
    }

    // 8. Lưu kết quả học tập
    const record = await AcademicRecord.create({
        student,
        subject,
        semester,
        attemptNumber,
        finalScore10,
        gradePoint4,
        creditsSnapshot,
        includedInGPA,
        isPassed,
        status: "confirmed"
    });

    return record;
};

// =====================================================
// EXPORT SERVICES
// =====================================================


module.exports = {
    getStudentProfile,
    getConfirmedRecords,
    calculateGPA,
    calculateEarnedCredits,
    getAcademicSummary,
    getSemesterResults,
    getRetakeHistory,
    getStudyProgress,
    checkInternshipEligibility,
    checkGraduationProjectEligibility,
    createAcademicRecord
};
