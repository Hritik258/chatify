import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setUserData } from "../redux/userSlice"
import { serverUrl } from "../main"

const useGetCurrentUser = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/user/current`,
          { withCredentials: true }
        )
        dispatch(setUserData(result.data))
      } catch (error) {
        
        if (error.response) {
          console.log("getCurrentUser error:", error.response.data?.message || error.response.status)
        } else if (error.request) {
          console.log("getCurrentUser network error: Server not responding")
        } else {
          console.log("getCurrentUser error:", error.message)
        }
      }
    }

    if (!userData) {
      fetchUser()
    }
  }, [])

  return null
}

export default useGetCurrentUser