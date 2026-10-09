const mongoose = require("mongoose"); //import mongoose
const connectDB=async()=>{ //tạo hàm kết nối 
    try {
        await mongoose.connect(process.env.MONGO_URI); //kết nối mongoose lấy chuỗi kết nối từ .env
        console.log("MongoDB Connected");
    }catch(error){
        console.log(error.message);
        process.exit(1); // nếu lỗi thì thoát chương trình
    }
};
module.exports=connectDB;