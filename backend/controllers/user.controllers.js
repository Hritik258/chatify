import User from '../models/user.model.js';
import uploadOnCloudinary from '../config/cloudinary.js';


export const editProfile = async (req, res) => {
  try {
    const userId = req.userId; 
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User ID missing" });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (name.length > 40) {
      return res.status(400).json({ message: "Display names must be 40 characters or fewer." });
    }
    let imageUrl = undefined;

    
    if (req.file) {
      const localFilePath = req.file.path;
      const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

      if (cloudinaryResponse) {
        
        imageUrl = cloudinaryResponse;
      } else {
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    
    const updateData = {};
    if (name) updateData.name = name;
    if (imageUrl) updateData.image = imageUrl;

    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true } 
    ).select('-password'); 

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Edit profile error:", error);
    return res.status(500).json({ message: "Unable to update your profile right now." });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User ID missing" });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Unable to load your profile right now." });
  }
};


export const getOtherUsers = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User ID missing" });
    }

   
    const users = await User.find({ _id: { $ne: userId } }).select('-password');
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get other users error:", error);
    return res.status(500).json({ message: "Unable to load contacts right now." });
  }
};
