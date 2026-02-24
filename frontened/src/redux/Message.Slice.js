import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: []
  },
  reducers: {  
    setMessage: (state, action) => {
      console.log("9️⃣ Reducer called with:", action.payload);
      console.log("🔟 Previous state:", state.messages);
      state.messages = action.payload;
      console.log("1️⃣1️⃣ New state:", state.messages);
    }
  }
});

export const { setMessage } = messageSlice.actions;
export default messageSlice.reducer;