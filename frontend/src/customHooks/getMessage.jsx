import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { markMessagesRead, setMessage } from "../redux/Message.Slice";
import { serverUrl } from "../main"; // ✅ import dynamic URL

const useGetMessage = () => {
  const dispatch = useDispatch();
  const { selectedUser, userData } = useSelector((state) => state.user);

  useEffect(() => {
    let active = true;
    dispatch(setMessage([]));

    const fetchMessage = async () => {
      try {
        if (!selectedUser?._id) {
          return;
        }

        // ✅ Use serverUrl instead of hardcoded localhost
        const endpoint = selectedUser.isGroup
          ? `${serverUrl}/api/message/group/${selectedUser._id}`
          : `${serverUrl}/api/message/${selectedUser._id}`;
        const result = await axios.get(
          endpoint,
          { withCredentials: true }
        );

        if (active) dispatch(setMessage(result.data));
      } catch {
        if (active) dispatch(setMessage([]));
      }
    };

    fetchMessage();
    return () => { active = false; };
  }, [selectedUser?._id, selectedUser?.isGroup, dispatch]);

  const { conversationId } = useSelector((state) => state.message);
  const { messages } = useSelector((state) => state.message);
  useEffect(() => {
    if (!conversationId || !userData?._id || !messages.some((message) =>
      String(message.sender) !== String(userData._id) &&
      !message.readBy?.some((id) => String(id) === String(userData._id))
    )) return undefined;
    let active = true;
    axios.post(`${serverUrl}/api/message/read/${conversationId}`, {}, { withCredentials: true })
      .then(({ data }) => { if (active) dispatch(markMessagesRead({ conversationId, readerId: data.readerId })); })
      .catch(() => {});
    return () => { active = false; };
  }, [conversationId, messages, userData?._id, dispatch]);
};

export default useGetMessage;
