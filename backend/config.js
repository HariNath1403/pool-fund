const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");

const connectDB = async () => {
  try {
    const DB_URI = `mongodb+srv://harivinnathan:${process.env.DB_PASSWORD}@pool-fund.hoygnrc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Pool-Fund`;

    const connection = await mongoose.connect(DB_URI);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
  connectDB,
  cloudinary,
};
