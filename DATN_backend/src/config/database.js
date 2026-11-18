
const mongoose = require("mongoose");
const ENV = require("./environment");

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            ENV.MONGODB_URI
        );

        console.log("=================================");
        console.log("MongoDB connected successfully!");
        console.log(`Host: ${connection.connection.host}`);
        console.log(`Database: ${connection.connection.name}`);
        console.log("=================================");

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

module.exports = connectDB;
