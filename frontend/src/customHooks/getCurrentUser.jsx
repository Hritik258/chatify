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
        dispatch(setUserData(null));
        if (!error.response) console.error("Unable to reach Chatify API", error.message);
      }
    }

    if (!userData) {
      fetchUser()
    }
  }, [dispatch, userData])

  return null
}

export default useGetCurrentUser
