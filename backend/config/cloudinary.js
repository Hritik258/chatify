import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from 'dotenv';


dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

;

const uploadOnCloudinary = async (filepath) => {
    try {
        
        
        const uploadResult = await cloudinary.uploader.upload(filepath);
        
        
        fs.unlinkSync(filepath);
        return uploadResult.secure_url;
        
    } catch (error) {
        console.log("❌ Cloudinary Upload Error Details:");
        console.log("   - Message:", error.message);
        console.log("   - Name:", error.name);
        console.log("   - Stack:", error.stack);
        
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        return null;
    }
};

export default uploadOnCloudinary;