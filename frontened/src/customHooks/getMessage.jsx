import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMessage } from "../redux/Message.Slice";
import { serverUrl } from "../main"; // ✅ import dynamic URL

const useGetMessage = () => {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        if (!selectedUser?._id) {
          return;
        }

        // ✅ Use serverUrl instead of hardcoded localhost
        const result = await axios.get(
          `${serverUrl}/api/message/${selectedUser._id}`,
          { withCredentials: true }
        );

        dispatch(setMessage(result.data));
      } catch (error) {
        console.log("❌ Error:", error);
      }
    };

    fetchMessage();
  }, [selectedUser, dispatch]);
};

export default useGetMessage;