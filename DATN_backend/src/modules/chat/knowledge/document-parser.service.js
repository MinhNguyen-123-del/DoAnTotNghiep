
const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const SUPPORTED_TYPES = ["pdf", "docx", "txt"];

/**
 * Chuẩn hóa văn bản sau khi trích xuất.
 */
const cleanText = (text) => {
    return String(text || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

/**
 * Đọc nội dung file PDF.
 */
const parsePDF = async (filePath) => {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);

    return {
        text: cleanText(result.text),
        pageCount: result.numpages || 0
    };
};

/**
 * Đọc nội dung file DOCX.
 */
const parseDOCX = async (filePath) => {
    const result = await mammoth.extractRawText({
        path: filePath
    });

    return {
        text: cleanText(result.value),
        pageCount: null,
        warnings: result.messages || []
    };
};

/**
 * Đọc nội dung file TXT.
 */
const parseTXT = async (filePath) => {
    const text = await fs.readFile(filePath, "utf8");

    return {
        text: cleanText(text),
        pageCount: null
    };
};

/**
 * Hàm chính: xác định định dạng và trích xuất nội dung.
 *
 * @param {string} filePath - Đường dẫn file đã upload.
 * @param {string} fileType - Định dạng pdf, docx hoặc txt.
 */
const parseDocument = async (filePath, fileType) => {
    if (!filePath) {
        throw new Error("Đường dẫn tài liệu không hợp lệ.");
    }

    const normalizedType = String(fileType || "")
        .toLowerCase()
        .replace(".", "");

    if (!SUPPORTED_TYPES.includes(normalizedType)) {
        throw new Error("Định dạng tài liệu không được hỗ trợ.");
    }

    const extension = path.extname(filePath).toLowerCase();

    if (extension !== `.${normalizedType}`) {
        throw new Error("Định dạng file không khớp với loại tài liệu.");
    }

    try {
        let result;

        switch (normalizedType) {
            case "pdf":
                result = await parsePDF(filePath);
                break;

            case "docx":
                result = await parseDOCX(filePath);
                break;

            case "txt":
                result = await parseTXT(filePath);
                break;

            default:
                throw new Error("Không thể xử lý định dạng tài liệu này.");
        }

        if (!result.text) {
            throw new Error(
                "Không trích xuất được văn bản. Tài liệu có thể trống hoặc là PDF scan."
            );
        }

        return {
            success: true,
            fileType: normalizedType,
            text: result.text,
            characterCount: result.text.length,
            pageCount: result.pageCount,
            warnings: result.warnings || []
        };
    } catch (error) {
        throw new Error(`Lỗi đọc tài liệu: ${error.message}`);
    }
};

module.exports = {
    parseDocument,
    cleanText
};
