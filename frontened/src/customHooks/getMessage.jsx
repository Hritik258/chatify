import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setMessage } from "../redux/Message.Slice"

const useGetMessage = () => {
  const dispatch = useDispatch()
  const { selectedUser } = useSelector((state) => state.user)

  useEffect(() => {
 

    const fetchMessage = async () => {
      try {
        
        
        if (!selectedUser?._id) {
         
          return;
        }

       
        
        const result = await axios.get(
          `http://localhost:8000/api/message/${selectedUser._id}`,
          { withCredentials: true }
        )

        
        
        dispatch(setMessage(result.data))
        
        

      } catch (error) {
        console.log("❌ Error:", error)
      }
    }

    fetchMessage()
  }, [selectedUser, dispatch])
}

export default useGetMessage