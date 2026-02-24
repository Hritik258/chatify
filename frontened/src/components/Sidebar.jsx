import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../main';
import dp from "../assets/dp.webp";
import { IoIosSearch } from "react-icons/io";
import { BiLogOutCircle } from "react-icons/bi";
import { RxCross2 } from "react-icons/rx";

import { setUserData, setOtherUser, setSelectedUsers, setOnlineUsers } from "../redux/userSlice";

function Sidebar() {
  const { userData, otherUsers, selectedUser, onlineUsers } = useSelector(state => state.user);
  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Helper to check online status (handles both string IDs and objects)
  const isUserOnline = (userId) => {
    if (!onlineUsers || !Array.isArray(onlineUsers)) return false;
    if (onlineUsers.length === 0) return false;
    if (typeof onlineUsers[0] === 'string') {
      return onlineUsers.includes(userId);
    }
    if (typeof onlineUsers[0] === 'object') {
      return onlineUsers.some(u => u._id === userId);
    }
    return false;
  };

  // Sort users: online first, then offline (for main list)
  const sortedUsers = useMemo(() => {
    if (!otherUsers) return [];
    return [...otherUsers].sort((a, b) => {
      const aOnline = isUserOnline(a._id);
      const bOnline = isUserOnline(b._id);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return 0;
    });
  }, [otherUsers, onlineUsers]);

  // Filtered users for search (case-insensitive)
  const filteredUsers = useMemo(() => {
    if (!otherUsers || !searchTerm) return [];
    return otherUsers.filter(user =>
      user.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [otherUsers, searchTerm]);

  // Online users preview (only when search is inactive)
  const onlineUsersList = useMemo(() => {
    if (!otherUsers) return [];
    return otherUsers.filter(user => isUserOnline(user._id));
  }, [otherUsers, onlineUsers]);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      dispatch(setUserData(null));
      dispatch(setOtherUser(null));
      dispatch(setSelectedUsers(null));
      dispatch(setOnlineUsers([]));
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return dp;
    const baseUrl = image.startsWith('http') ? image : `${serverUrl}${image}`;
    // Add timestamp for cache busting
    return `${baseUrl}?t=${Date.now()}`;
  };

  const handleSelectUser = (user) => {
    dispatch(setSelectedUsers(user));
    // Close search and clear term after selection
    setSearchActive(false);
    setSearchTerm('');
  };

  const clearSearch = () => {
    setSearchActive(false);
    setSearchTerm('');
  };

  return (
    <div className={`lg:w-[30%] w-full h-screen lg:block bg-slate-200 ${!selectedUser ? "block" : "hidden"}`}>
      {/* Logout Button */}
      <div
        className='w-[60px] h-[60px] rounded-full
          flex justify-center items-center bg-[#20c7ff]
          shadow-lg cursor-pointer fixed bottom-[20px] left-[10px] z-10'
        onClick={handleLogOut}
      >
        <BiLogOutCircle className='w-[28px] h-[28px] text-white' />
      </div>

      {/* Header */}
      <div className='w-full h-[300px] bg-[#20c7ff] rounded-b-[30%]
          shadow-gray-400 shadow-lg flex flex-col justify-center px-[20px]'>
        <h1 className='text-white font-bold text-[25px]'>chatify</h1>

        {/* User Info */}
        <div className='w-full flex justify-between items-start mt-[20px]'>
          <h1 className='text-gray-800 font-semibold text-[25px]'>
  Hii , {userData?.name || userData?.userName || "User"}
</h1>
          {/* Profile Image */}
          <div
            className='w-[60px] h-[60px] rounded-full overflow-hidden cursor-pointer shadow-lg'
            onClick={() => navigate("/profile")}
          >
            <img
              src={getImageUrl(userData?.image)}
              alt="profile"
              className='w-full h-full object-cover'
              onError={(e) => { e.target.src = dp }}
            />
          </div>
        </div>

        {/* Search + Online Users Preview */}
        <div className='w-full flex items-center gap-[15px] mt-[20px]'>
          {/* Search Button */}
          {!searchActive && (
            <div
              className='w-[55px] h-[55px] rounded-full
                flex items-center justify-center
                bg-white shadow-lg cursor-pointer'
              onClick={() => setSearchActive(true)}
            >
              <IoIosSearch className='w-[25px] h-[25px] text-gray-700' />
            </div>
          )}

          {/* Search Input */}
          {searchActive && (
            <div className='flex items-center bg-white px-[15px]
                rounded-full h-[55px] shadow-lg w-full'>
              <IoIosSearch className='w-[22px] h-[22px] text-gray-500' />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='flex-1 px-[10px] outline-none border-none bg-transparent'
                autoFocus
              />
              <RxCross2
                className='w-[22px] h-[22px] cursor-pointer text-gray-500'
                onClick={clearSearch}
              />
            </div>
          )}

          {/* Online Users Preview (only when search is OFF) */}
          {!searchActive && (
            <div className='flex items-center gap-2 overflow-x-auto'>
              {onlineUsersList.length > 0 ? (
                onlineUsersList.map((user) => (
                  <div
                    key={user._id}
                    className='relative w-[50px] h-[50px] rounded-full
                      overflow-hidden shadow-md bg-white cursor-pointer flex-shrink-0'
                    title={user.userName}
                    onClick={() => handleSelectUser(user)}
                  >
                    <img
                      src={getImageUrl(user.image)}
                      alt={user.userName}
                      className='w-full h-full object-cover'
                      onError={(e) => { e.target.src = dp }}
                    />
                    <span className='absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md z-10'></span>
                  </div>
                ))
              ) : (
                <span className='text-gray-400 text-sm'>No online users</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* User List Section */}
      <div className='w-full h-[60vh] overflow-auto flex flex-col gap-4 items-center mt-5 px-2'>
        {/* Show filtered results when search is active and has term */}
        {searchActive && searchTerm && (
          <>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const online = isUserOnline(user._id);
                return (
                  <div
                    key={user._id}
                    className='w-[95%] h-[60px] flex justify-start items-center gap-4 bg-white shadow-md rounded-full px-2 hover:shadow-lg transition-shadow cursor-pointer'
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className='w-[50px] h-[50px] rounded-full overflow-hidden flex-shrink-0 relative'>
                      <img
                        src={getImageUrl(user.image)}
                        alt={user.userName}
                        className='w-full h-full object-cover'
                        onError={(e) => { e.target.src = dp }}
                      />
                      {online && (
                        <span className='absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md z-10'></span>
                      )}
                    </div>
                    <h1 className='font-medium text-gray-800'>{user.userName}</h1>
                  </div>
                );
              })
            ) : (
              <div className='text-center text-gray-500 mt-10'>No users found</div>
            )}
          </>
        )}

        {/* Show regular sorted list when not searching or search term is empty */}
        {(!searchActive || !searchTerm) && (
          sortedUsers.map((user) => {
            const online = isUserOnline(user._id);
            return (
              <div
                key={user._id}
                className='w-[95%] h-[60px] flex justify-start items-center gap-4 bg-white shadow-md rounded-full px-2 hover:shadow-lg transition-shadow cursor-pointer'
                onClick={() => handleSelectUser(user)}
              >
                <div className='w-[50px] h-[50px] rounded-full overflow-hidden flex-shrink-0 relative'>
                  <img
                    src={getImageUrl(user.image)}
                    alt={user.userName}
                    className='w-full h-full object-cover'
                    onError={(e) => { e.target.src = dp }}
                  />
                  {online && (
                    <span className='absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md z-10'></span>
                  )}
                </div>
                <h1 className='font-medium text-gray-800'>{user.userName}</h1>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Sidebar;