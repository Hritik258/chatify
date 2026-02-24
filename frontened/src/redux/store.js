import {configureStore} from "@reduxjs/toolkit"
import userSlice from "./userSlice"
import messageSlice from "./Message.Slice"
export const store=configureStore({
    reducer:{
        user:userSlice,
        message:messageSlice
    }
})