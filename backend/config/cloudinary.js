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
        
        
        await fs.promises.unlink(filepath).catch(() => {});
        return uploadResult.secure_url;
        
    } catch (error) {
        console.error("Cloudinary upload failed:", error.message);
        
        if (fs.existsSync(filepath)) {
            await fs.promises.unlink(filepath).catch(() => {});
        }
        return null;
    }
};

export default uploadOnCloudinary;
