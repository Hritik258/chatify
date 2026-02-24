import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    otherUsers: null,
    selectedUser:null,
    socket:null,
    onlineUsers:null
  },
  reducers: {  
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setOtherUser: (state, action) => {
      state.otherUsers = action.payload;
    }
    ,
    setSelectedUsers: (state, action) => {
      state.selectedUser = action.payload;
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    }

  },
});

export const { setUserData,setOtherUser,setSelectedUsers,setSocket,setOnlineUsers} = userSlice.actions;
export default userSlice.reducer;