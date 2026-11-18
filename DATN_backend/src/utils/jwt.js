const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("Thiếu JWT_SECRET trong file .env");
    }

    return jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
};

module.exports = {
    generateAccessToken,
    verifyAccessToken
};