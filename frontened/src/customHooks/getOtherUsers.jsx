import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setOtherUser, setUserData } from "../redux/userSlice"
import { serverUrl } from "../main"

const getOtherUsers = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/user/others`,
          { withCredentials: true }
        )
        dispatch(setOtherUser(result.data))
      } catch (error) {
        console.log(error)
      }
    }

    if (!userData) {
      fetchUser()
    }
  }, [userData])
}

export default getOtherUsers 