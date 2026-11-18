
const app = require("./app");
const connectDB = require("./config/database");
const ENV = require("./config/environment");

// Hàm khởi động toàn bộ Backend
const startServer = async () => {
    try {
        // Kết nối MongoDB trước khi mở cổng Server
        await connectDB();

        // Khởi động Express Server
        app.listen(ENV.PORT, () => {
            console.log("-----------------------------------");
            console.log("DATN BACKEND STARTED SUCCESSFULLY");
            console.log(`Server: http://localhost:${ENV.PORT}`);
            console.log(`Environment: ${ENV.NODE_ENV}`);
            console.log("-----------------------------------");
        });
    } catch (error) {
        // Nếu kết nối Database thất bại thì dừng khởi động
        console.error("Cannot start server:", error.message);
        process.exit(1);
    }
};

// Thực hiện khởi động Backend
startServer();
