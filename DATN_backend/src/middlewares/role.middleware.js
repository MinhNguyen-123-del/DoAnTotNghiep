
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Kiểm tra đăng nhập
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Vui lòng đăng nhập để tiếp tục."
            });
        }

        // Kiểm tra quyền
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thực hiện chức năng này."
            });
        }

        next();
    };
};

module.exports = {
    authorize
};
