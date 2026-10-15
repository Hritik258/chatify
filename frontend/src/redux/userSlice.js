import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    authChecked: false,
    otherUsers: [],
    selectedUser:null,
    socket:null,
    onlineUsers:[]
  },
  reducers: {  
    setUserData: (state, action) => {
      state.userData = action.payload;
      state.authChecked = true;
    },
    setOtherUser: (state, action) => {
      state.otherUsers = Array.isArray(action.payload) ? action.payload : [];
    }
    ,
    setSelectedUsers: (state, action) => {
      state.selectedUser = action.payload;
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = Array.isArray(action.payload) ? action.payload : [];
    }

  },
});

export const { setUserData,setOtherUser,setSelectedUsers,setSocket,setOnlineUsers} = userSlice.actions;
export default userSlice.reducer;
