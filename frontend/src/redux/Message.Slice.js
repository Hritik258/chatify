import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    conversationId: null,
  },
  reducers: {  
    setMessage: (state, action) => {
      state.messages = action.payload.messages ?? action.payload;
      state.conversationId = action.payload.conversationId ?? null;
    },
    setConversationId: (state, action) => {
      state.conversationId = action.payload;
    },
    addMessage: (state, action) => {
      if (!state.messages.some((message) => message._id === action.payload._id)) {
        state.messages.push(action.payload);
      }
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex((message) => message._id === action.payload._id);
      if (index >= 0) state.messages[index] = action.payload;
    },
    markMessagesRead: (state, action) => {
      const { conversationId, readerId } = action.payload;
      if (state.conversationId !== conversationId) return;
      state.messages.forEach((message) => {
        if (String(message.sender) !== String(readerId) && !message.readBy?.some((id) => String(id) === String(readerId))) {
          message.readBy = [...(message.readBy || []), readerId];
        }
      });
    }
  }
});

export const { setMessage, setConversationId, addMessage, updateMessage, markMessagesRead } = messageSlice.actions;
export default messageSlice.reducer;
