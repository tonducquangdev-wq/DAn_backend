const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("❌ Lỗi: Biến môi trường MONGO_URI chưa được thiết lập trong .env!");
            process.exit(1);
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected thành công: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;