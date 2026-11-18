
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        // Email đăng nhập
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Mật khẩu đã mã hóa
        password: {
            type: String,
            required: true,
            select: false
        },

        // Vai trò tài khoản
        role: {
            type: String,
            enum: ["student", "admin", "advisor"],
            default: "student",
            required: true
        },

        // Trạng thái tài khoản
        status: {
            type: String,
            enum: ["active", "inactive", "locked"],
            default: "active"
        },

        // Trạng thái xác minh email
        isVerified: {
            type: Boolean,
            default: false
        },

        // Lần đăng nhập gần nhất
        lastLogin: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// =====================================================
// 1. MÃ HÓA MẬT KHẨU TRƯỚC KHI LƯU
// =====================================================

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(
        this.password,
        salt
    );
});

// =====================================================
// 2. KIỂM TRA MẬT KHẨU
// =====================================================

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(
        candidatePassword,
        this.password
    );
};

// =====================================================
// 3. EXPORT MODEL
// =====================================================

const User = mongoose.model("User", userSchema);

module.exports = User;
