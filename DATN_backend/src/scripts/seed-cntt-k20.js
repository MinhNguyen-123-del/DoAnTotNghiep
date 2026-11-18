
require("dotenv").config();

const mongoose = require("mongoose");

const Subject = require("../modules/academic/models/subject.model");
const CurriculumVersion = require("../modules/curriculums/curriculum-version.model");
const CurriculumSubject = require("../modules/curriculums/curriculum-subject.model");

const VERSION_ID = "6afc8beeb90d023df2173e1b";
const TARGET_CREDITS = 120;
const ELECTIVE_REQUIRED_CREDITS = 15;

// [Mã môn, Tên môn, Tín chỉ, Học kỳ, Nhóm, Loại]
const subjects = [
    // HỌC PHẦN CHUNG
    ["LUCS1129", "Pháp luật đại cương", 3, 2, "general"],
    ["LLNL1105", "Triết học Mác - Lênin", 3, 2, "general"],
    ["LLNL1106", "Kinh tế chính trị Mác - Lênin", 2, 3, "general"],
    ["LLNL1107", "Chủ nghĩa xã hội khoa học", 2, 4, "general"],
    ["LLTT1101", "Tư tưởng Hồ Chí Minh", 2, 5, "general"],
    ["LLDL1102", "Lịch sử Đảng Cộng sản Việt Nam", 2, 6, "general"],

    // HỌC PHẦN CỦA TRƯỜNG
    ["KHMA1101", "Kinh tế vĩ mô 1", 3, 1, "school"],
    ["TOCB1101", "Đại số tuyến tính", 3, 1, "school"],
    ["TOKT1145", "Lý thuyết xác suất và thống kê toán", 3, 2, "school"],
    ["KHMI1101", "Kinh tế vi mô 1", 3, 2, "school"],
    ["NNKC1131", "Tiếng Anh 1", 3, 1, "school"],
    ["NNKC1132", "Tiếng Anh 2", 3, 2, "school"],
    ["NNKC1133", "Tiếng Anh 3", 3, 3, "school"],

    // KIẾN THỨC NỀN TẢNG NGÀNH
    ["CNTT1191", "Vật lý đại cương", 3, 1, "major_foundation"],
    ["CNTT1116", "Nhập môn công nghệ thông tin", 3, 1, "major_foundation"],
    ["TIHT1101", "Cấu trúc dữ liệu và giải thuật", 3, 3, "major_foundation"],

    // CƠ SỞ NGÀNH
    ["TOCB1107", "Toán rời rạc", 3, 1, "core"],
    ["CNTT1182", "Phương pháp tính", 3, 3, "core"],
    ["CNTT1107", "Hệ điều hành", 3, 3, "core"],

    // KIẾN THỨC NGÀNH BẮT BUỘC
    ["CNTT1192", "Tiếng Anh chuyên ngành", 3, 3, "major_required"],
    ["CNTT1131", "Lập trình hướng đối tượng", 3, 3, "major_required"],
    ["CNTT1112", "Kiến trúc máy tính", 3, 4, "major_required"],
    ["CNTT1152", "Hệ quản trị cơ sở dữ liệu", 3, 4, "major_required"],
    ["CNTT1114", "Mạng máy tính và truyền số liệu", 3, 4, "major_required"],
    ["CNTT1196", "Chuyên đề thực tế - CNTT", 4, 5, "major_required"],
    ["CNTT1117", "Phân tích và thiết kế hệ thống", 3, 5, "major_required"],
    ["CNTT-DX01", "Công nghệ phần mềm", 3, 5, "major_required"],
    ["CNTT-DX03", "Kiểm thử phần mềm", 3, 6, "major_required"],

    // TỰ CHỌN - YÊU CẦU HOÀN THÀNH 15 TÍN CHỈ
    ["CNTT1165", "Thiết kế Web", 3, 4, "elective"],
    ["CNTT1153", "Lập trình Java", 3, 4, "elective"],
    ["CNTT1140", "Trí tuệ nhân tạo", 3, 5, "elective"],
    ["CNTT1168", "An toàn và bảo mật thông tin", 3, 6, "elective"],
    ["CNTT1157", "Phát triển ứng dụng di động", 3, 7, "elective"],

    // ĐÃ CÓ TRONG DATABASE
    ["IT001", "Nhập môn lập trình", 3, 1, "core"],
    ["IT002", "Cơ sở dữ liệu", 3, 2, "major_foundation"],
    ["IT003", "Lập trình Web", 3, 3, "major_required"],
    ["IT004", "Thực tập tốt nghiệp", 6, 8, "internship", "internship"],

    // KHÓA LUẬN
    ["CNTT-KLTN", "Khóa luận tốt nghiệp", 9, 8, "graduation", "graduation_project"]
];

async function main() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("Thiếu MONGODB_URI trong .env");
    }

    // KIỂM TRA DỮ LIỆU TRƯỚC KHI GHI
    const codes = subjects.map(item => item[0]);

    if (new Set(codes).size !== codes.length) {
        throw new Error("Danh sách có mã môn bị trùng");
    }

    const requiredCredits = subjects
        .filter(item => item[4] !== "elective")
        .reduce((sum, item) => sum + item[2], 0);

    const electiveCredits = subjects
        .filter(item => item[4] === "elective")
        .reduce((sum, item) => sum + item[2], 0);

    const total = requiredCredits + ELECTIVE_REQUIRED_CREDITS;

    console.log("Tín chỉ bắt buộc:", requiredCredits);
    console.log("Tín chỉ tự chọn có sẵn:", electiveCredits);
    console.log("Tín chỉ tự chọn yêu cầu:", ELECTIVE_REQUIRED_CREDITS);
    console.log("Tổng tín chỉ yêu cầu:", total);

    if (electiveCredits < ELECTIVE_REQUIRED_CREDITS) {
        throw new Error("Không đủ tín chỉ tự chọn");
    }

    if (total !== TARGET_CREDITS) {
        throw new Error(
            `Sai tổng tín chỉ: ${total}, yêu cầu ${TARGET_CREDITS}`
        );
    }

    await mongoose.connect(mongoUri);

    const version = await CurriculumVersion.findById(VERSION_ID);

    if (!version || version.status !== "draft") {
        throw new Error("Không tìm thấy phiên bản draft CNTT K20");
    }

    // KIỂM TRA MÔN ĐÃ CÓ
    const existingSubjects = await Subject.find({
        subjectCode: { $in: codes }
    });

    const subjectMap = new Map(
        existingSubjects.map(s => [s.subjectCode, s])
    );

    for (const [code, , credits] of subjects) {
        const existing = subjectMap.get(code);

        if (existing && Number(existing.credits) !== credits) {
            throw new Error(`Sai tín chỉ môn ${code}`);
        }
    }

    // KIỂM TRA LIÊN KẾT HIỆN TẠI
    const existingLinks = await CurriculumSubject.find({
        curriculumVersion: version._id
    }).populate("subject");

    const linkMap = new Map();

    for (const link of existingLinks) {
        const code = link.subject?.subjectCode;

        if (!code || !codes.includes(code)) {
            throw new Error(
                `CTĐT có môn ngoài danh sách seed: ${code || link.subject}`
            );
        }

        const definition = subjects.find(item => item[0] === code);
        const expectedRequired = definition[4] !== "elective";
        const expectedType = definition[5] || "normal";

        if (
            Number(link.credits) !== definition[2] ||
            link.isRequired !== expectedRequired ||
            (link.requirementType || "normal") !== expectedType
        ) {
            throw new Error(
                `Liên kết môn ${code} không khớp. Cần kiểm tra thủ công.`
            );
        }

        linkMap.set(code, link);
    }

    let createdSubjects = 0;
    let createdLinks = 0;

    // TẠO MÔN VÀ LIÊN KẾT
    for (const [
        code,
        name,
        credits,
        semester,
        group,
        requirementType = "normal"
    ] of subjects) {
        let subject = subjectMap.get(code);

        if (!subject) {
            subject = await Subject.create({
                subjectCode: code,
                subjectName: name,
                credits
            });

            createdSubjects++;
        }

        if (!linkMap.has(code)) {
            await CurriculumSubject.create({
                curriculum: version.curriculum,
                curriculumVersion: version._id,
                subject: subject._id,
                credits,
                recommendedSemester: semester,
                group,
                requirementType,
                isRequired: group !== "elective"
            });

            createdLinks++;
        }
    }

    // KIỂM TRA LẠI TỪ DATABASE
    const finalLinks = await CurriculumSubject.find({
        curriculumVersion: version._id
    });

    const actualRequired = finalLinks
        .filter(link => link.isRequired)
        .reduce((sum, link) => sum + link.credits, 0);

    const actualTotal =
        actualRequired + ELECTIVE_REQUIRED_CREDITS;

    if (actualTotal !== TARGET_CREDITS) {
        throw new Error(
            `Tổng tín chỉ thực tế không đúng: ${actualTotal}`
        );
    }

    version.totalCreditsRequired = actualTotal;
    await version.save();

    console.log("========== HOÀN THÀNH ==========");
    console.log("Môn mới:", createdSubjects);
    console.log("Liên kết mới:", createdLinks);
    console.log("Tổng số môn:", finalLinks.length);
    console.log("Tổng tín chỉ yêu cầu:", actualTotal);
}

main()
    .catch(error => {
        console.error("LỖI:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
