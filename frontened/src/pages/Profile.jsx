import React, { useRef, useState } from 'react';
import dp from "../assets/dp.webp";
import { IoCameraOutline } from "react-icons/io5";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setUserData } from '../redux/userSlice';   

const Profile = () => {
    const navigate = useNavigate();
    const { userData } = useSelector(state => state.user);
    const dispatch = useDispatch();
    
    const [name, setName] = useState(userData?.name || '');
    const [profileImage, setProfileImage] = useState(userData?.image || dp);
    const [backendImage, setBackendImage] = useState(null);
    const [saving, setSaving] = useState(false);
    
    let image = useRef();

    if (!userData) {
        navigate('/login');
        return null;
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBackendImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            let formData = new FormData();
            formData.append("name", name);
            if (backendImage) {
                formData.append("image", backendImage);   
            }

            const result = await axios.put("http://localhost:8000/api/user/profile", formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            
            
            // ✅ CORRECT DISPATCH
            dispatch(setUserData(result.data));
            
            setSaving(false);
            navigate("/");
            
        } catch (error) {
            console.log("Error:", error);
            setSaving(false);
        }
    };

    return (
        <div className='w-full h-[100vh] bg-slate-200 flex flex-col justify-center items-center gap-5 relative'>
            <button className='absolute top-5 left-5 cursor-pointer' onClick={() => navigate("/")}>
                <IoIosArrowRoundBack className='w-[50px] h-[50px] text-gray-600'/>
            </button>

            <div className='bg-white rounded-full border-4 border-[#20c7ff] shadow-gray-400 shadow-lg relative' onClick={() => image.current.click()}>      
                <div className='w-[200px] h-[200px] rounded-full overflow-hidden'>
                    <img src={profileImage} alt="profile" className='h-full w-full object-cover' onError={(e) => e.target.src = dp} />
                </div>
                <div className='absolute bottom-4 right-4 w-[35px] h-[35px] rounded-full bg-[#20cff7] flex justify-center items-center shadow-lg'>
                    <IoCameraOutline className='text-gray-700 w-[25px] h-[25px]'/>
                </div>
            </div>

            <form className='w-[95%] max-w-[500px] flex flex-col gap-5 items-center' onSubmit={handleProfile}>
                <input type="file" accept='image/*' ref={image} hidden onChange={handleImageUpload} />
                
                <input type="text" placeholder="Enter your name" value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='w-[90%] h-[50px] outline-none border-2 border-[#20c7ff] px-5 py-2.5 bg-white rounded-lg shadow-gray-300 shadow-lg text-gray-700 text-[19px]' 
                />
                
                <input type="text" readOnly value={userData?.userName}
                    className='w-[90%] h-[60px] outline-none border-2 border-[#20c7ff] px-5 py-2.5 bg-white rounded-lg shadow-gray-200 shadow-lg text-gray-400 text-[19px]' 
                />
                
                <input type="email" readOnly value={userData?.email}
                    className='w-[90%] h-[60px] outline-none border-2 border-[#20c7ff] px-5 py-2.5 bg-white rounded-lg shadow-gray-200 shadow-lg text-gray-400 text-[19px]' 
                />
                
                <button type="submit" disabled={saving}
                    className='px-5 py-2.5 bg-[#20c7ff] rounded-2xl shadow-gray-400 shadow-lg text-[20px] w-[200px] mt-5 font-semibold hover:shadow-inner disabled:opacity-50'>
                    {saving ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
};

export default Profile;