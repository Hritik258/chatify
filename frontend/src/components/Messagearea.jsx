import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { FaImages, FaWandMagicSparkles } from 'react-icons/fa6';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { RiEmojiStickerLine, RiSendPlane2Fill } from 'react-icons/ri';
import { IoSearchOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { setSelectedUsers } from '../redux/userSlice';
import { addMessage, markMessagesRead, updateMessage } from '../redux/Message.Slice';
import Sendermessage from './Sendermessage';
import ReceiverMessage from './ReceiverMessage';
import { serverUrl } from '../main';
import dp from '../assets/dp.webp';

const EmojiPicker = lazy(() => import('emoji-picker-react'));
const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function Messagearea({ socket }) {
  const { selectedUser, userData } = useSelector((state) => state.user);
  const { messages, conversationId } = useSelector((state) => state.message);
  const dispatch = useDispatch();
  const [showPicker, setShowPicker] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const imageRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConversationId = useRef(conversationId);
  const typingTimer = useRef(null);
  const remoteTypingTimer = useRef(null);
  activeConversationId.current = conversationId;

  const visibleMessages = useMemo(() => {
    const term = searchText.trim().toLocaleLowerCase();
    if (!term) return messages;
    return messages.filter((message) => message.message?.toLocaleLowerCase().includes(term));
  }, [messages, searchText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (!socket || !conversationId) return undefined;
    socket.emit('joinConversation', { conversationId });
    const handleNewMessage = (message) => {
      if (String(message.conversationId) === String(activeConversationId.current)) dispatch(addMessage(message));
    };
    const handleMessageUpdated = (message) => {
      if (String(message.conversationId) === String(activeConversationId.current)) dispatch(updateMessage(message));
    };
    const handleMessagesRead = ({ conversationId: readConversationId, readerId }) => {
      dispatch(markMessagesRead({ conversationId: readConversationId, readerId }));
    };
    const handleTyping = (event) => {
      if (String(event.conversationId) !== String(activeConversationId.current) || String(event.userId) === String(userData?._id)) return;
      setTyping(event.isTyping);
      clearTimeout(remoteTypingTimer.current);
      if (event.isTyping) remoteTypingTimer.current = setTimeout(() => setTyping(false), 1800);
    };
    socket.on('newMessage', handleNewMessage);
    socket.on('messageUpdated', handleMessageUpdated);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('typing', handleTyping);
    return () => {
      socket.emit('leaveConversation', { conversationId });
      socket.off('newMessage', handleNewMessage);
      socket.off('messageUpdated', handleMessageUpdated);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('typing', handleTyping);
      clearTimeout(remoteTypingTimer.current);
      clearTimeout(typingTimer.current);
    };
  }, [socket, conversationId, dispatch, userData?._id]);

  useEffect(() => {
    if (!imagePreview) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    setSummary('');
    setSearchText('');
    setSearchOpen(false);
  }, [conversationId]);

  const suggestReply = async () => {
    if (!selectedUser || !conversationId) return;
    const context = messages.filter((message) => typeof message.message === 'string' && message.message.trim()).slice(-12).map((message) => ({
      role: String(message.sender) === String(userData?._id) ? 'assistant' : 'user',
      text: message.message,
    }));
    if (!context.length) {
      setError('Send a text message first to get a reply suggestion.');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const response = await axios.post(`${serverUrl}/api/ai/reply-suggestion`, { messages: context, recipientName: selectedUser.name || selectedUser.userName }, { withCredentials: true });
      if (activeConversationId.current === conversationId) {
        setTextMessage(response.data.suggestion);
        setShowPicker(false);
      }
    } catch (requestError) {
      if (activeConversationId.current === conversationId) setError(requestError.response?.data?.message || 'Could not create a reply suggestion. Please try again.');
    } finally {
      if (activeConversationId.current === conversationId) setAiLoading(false);
    }
  };

  const summarizeChat = async () => {
    if (!conversationId) return;
    setSummaryLoading(true);
    setError('');
    try {
      const response = await axios.post(`${serverUrl}/api/ai/summarize/${conversationId}`, {}, { withCredentials: true });
      if (activeConversationId.current === conversationId) setSummary(response.data.summary);
    } catch (requestError) {
      if (activeConversationId.current === conversationId) setError(requestError.response?.data?.message || 'Could not summarize this chat. Please try again.');
    } finally {
      if (activeConversationId.current === conversationId) setSummaryLoading(false);
    }
  };

  const sendTyping = (value) => {
    if (!socket || !conversationId) return;
    socket.emit('typing', { conversationId, isTyping: value });
    clearTimeout(typingTimer.current);
    if (value) typingTimer.current = setTimeout(() => socket.emit('typing', { conversationId, isTyping: false }), 900);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (sending || (!textMessage.trim() && !imageFile)) return;
    setSending(true);
    setError('');
    sendTyping(false);
    try {
      if (editingMessageId) {
        const response = await axios.patch(`${serverUrl}/api/message/${editingMessageId}`, { message: textMessage }, { withCredentials: true });
        dispatch(updateMessage(response.data));
        setEditingMessageId(null);
        setTextMessage('');
        return;
      }
      const formData = new FormData();
      formData.append('message', textMessage.trim());
      if (imageFile) formData.append('image', imageFile);
      const url = selectedUser.isGroup
        ? `${serverUrl}/api/message/group/${selectedUser._id}/send`
        : `${serverUrl}/api/message/send/${selectedUser._id}`;
      const response = await axios.post(url, formData, { withCredentials: true });
      dispatch(addMessage(response.data));
      setTextMessage('');
      setImageFile(null);
      setImagePreview(null);
      if (imageRef.current) imageRef.current.value = '';
      setShowPicker(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Your message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const editMessage = (message) => {
    if (message.deletedAt || !message.message) return;
    setEditingMessageId(message._id);
    setTextMessage(message.message);
    setImageFile(null);
    setImagePreview(null);
    setError('');
  };

  const deleteMessage = async (message) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      const response = await axios.delete(`${serverUrl}/api/message/${message._id}`, { withCredentials: true });
      dispatch(updateMessage(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete this message.');
    }
  };

  const reactToMessage = async (message, emoji) => {
    try {
      const response = await axios.patch(`${serverUrl}/api/message/${message._id}/reaction`, { emoji }, { withCredentials: true });
      dispatch(updateMessage(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update reaction.');
    }
  };

  const avatar = selectedUser?.image?.startsWith('http') ? selectedUser.image : selectedUser?.image ? `${serverUrl}${selectedUser.image}` : dp;
  const senderName = (message) => selectedUser.isGroup
    ? selectedUser.participants?.find((participant) => String(participant._id) === String(message.sender))?.name || selectedUser.participants?.find((participant) => String(participant._id) === String(message.sender))?.userName || 'Member'
    : selectedUser.name || selectedUser.userName;

  if (!selectedUser) return <main className="conversation-empty"><div className="empty-art"><span className="empty-art-orbit" /><span className="empty-art-bubble">✦</span></div><p className="eyebrow">A LITTLE CLOSER</p><h1>Make room for<br /><em>a good conversation.</em></h1><p className="empty-description">Pick someone from your contacts and say hello. The best chats start with a simple message.</p><div className="empty-tip"><span>✧</span> Your next favorite conversation could be one message away.</div></main>;

  return (
    <main className={`conversation ${selectedUser ? 'conversation--active' : ''}`}>
      <header className="conversation-header">
        <button className="back-button" aria-label="Back to contacts" onClick={() => dispatch(setSelectedUsers(null))}><IoIosArrowRoundBack /></button>
        <span className={`conversation-avatar ${selectedUser.isGroup ? 'conversation-avatar--group' : ''}`}>{selectedUser.isGroup ? '👥' : <img src={avatar} alt="" onError={(event) => { event.currentTarget.src = dp; }} />}</span>
        <div className="conversation-person"><h2>{selectedUser.name || selectedUser.userName}</h2><p>{selectedUser.isGroup ? `${selectedUser.participants?.length || 0} members` : <><span className="presence-dot" /> Here to chat</>}</p></div>
        <div className="conversation-tools">
          <button type="button" className="header-tool" onClick={summarizeChat} disabled={summaryLoading || !messages.length} title="Summarize chat"><IoDocumentTextOutline /> <span>{summaryLoading ? 'Summarizing…' : 'Summary'}</span></button>
          <button type="button" className="header-tool header-search-button" onClick={() => { setSearchOpen((open) => !open); setSearchText(''); }} aria-label="Search messages" title="Search messages"><IoSearchOutline /></button>
        </div>
      </header>
      {searchOpen && <div className="chat-search"><IoSearchOutline /><input autoFocus value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search in this chat" aria-label="Search in this chat" /><span>{searchText ? `${visibleMessages.length} found` : 'Type to search'}</span><button onClick={() => { setSearchOpen(false); setSearchText(''); }} aria-label="Close search">×</button></div>}
      {summary && <section className="chat-summary"><div><strong>Chat summary</strong><button type="button" onClick={() => setSummary('')} aria-label="Close summary">×</button></div><p>{summary}</p></section>}

      <section className="message-list" aria-label="Conversation messages" aria-live="polite">
        <div className="conversation-day">{selectedUser.isGroup ? 'GROUP CONVERSATION' : 'YOUR CONVERSATION'}</div>
        {visibleMessages.length ? visibleMessages.map((message) => {
          const props = {
            key: message._id,
            messageItem: message,
            onEdit: editMessage,
            onDelete: deleteMessage,
            onReact: reactToMessage,
            quickReactions,
            senderName: senderName(message),
            isGroup: selectedUser.isGroup,
            seenCount: message.readBy?.filter((id) => String(id) !== String(message.sender)).length || 0,
          };
          return String(message.sender) === String(userData?._id)
            ? <Sendermessage {...props} />
            : <ReceiverMessage {...props} profileImage={selectedUser.participants?.find((person) => String(person._id) === String(message.sender))?.image || selectedUser.image} />;
        }) : messages.length && searchText ? <div className="chat-search-empty">No messages match “{searchText}”.</div> : <div className="first-message"><span>✉</span><strong>Say hello to {selectedUser.name || selectedUser.userName}</strong><small>This is the beginning of something good.</small></div>}
        {typing && <div className="typing-indicator"><span /><span /><span /> {selectedUser.isGroup ? 'Someone is typing' : 'Typing…'}</div>}
        <div ref={messagesEndRef} />
      </section>

      {imagePreview && <div className="image-draft"><img src={imagePreview} alt="Image attachment preview" /><button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (imageRef.current) imageRef.current.value = ''; }} aria-label="Remove image">×</button></div>}
      <div className="composer-wrap">
        {error && <p className="composer-error" role="alert">{error}</p>}
        {editingMessageId && <div className="editing-note">Editing message <button type="button" onClick={() => { setEditingMessageId(null); setTextMessage(''); }}>Cancel</button></div>}
        {showPicker && <div className="emoji-popover"><Suspense fallback={<div className="emoji-loading">Loading emojis…</div>}><EmojiPicker width="100%" height={340} onEmojiClick={({ emoji }) => setTextMessage((current) => current + emoji)} /></Suspense></div>}
        <form className="composer" onSubmit={sendMessage}>
          <button className="composer-icon" type="button" aria-label="Add emoji" aria-expanded={showPicker} onClick={() => setShowPicker((visible) => !visible)}><RiEmojiStickerLine /></button>
          <input ref={imageRef} type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { setError('Images must be smaller than 5 MB.'); event.target.value = ''; return; } setError(''); setImageFile(file); setImagePreview(URL.createObjectURL(file)); }} />
          <input className="composer-input" value={textMessage} onChange={(event) => { setTextMessage(event.target.value); sendTyping(Boolean(event.target.value.trim())); }} placeholder={editingMessageId ? 'Edit your message…' : 'Write something kind…'} aria-label="Message" maxLength={2000} />
          <span className="composer-divider" />
          {!editingMessageId && <button className="composer-icon ai-button" type="button" onClick={suggestReply} disabled={aiLoading || !conversationId} aria-label="Suggest an AI reply" title="Suggest a reply with AI">{aiLoading ? <span className="mini-spinner" /> : <FaWandMagicSparkles />}</button>}
          {!editingMessageId && <button className="composer-icon" type="button" aria-label="Attach an image" onClick={() => imageRef.current?.click()}><FaImages /></button>}
          <button className="send-button" type="submit" disabled={sending || (!textMessage.trim() && !imageFile)} aria-label={editingMessageId ? 'Save message edit' : 'Send message'}>{sending ? <span className="mini-spinner" /> : <RiSendPlane2Fill />}</button>
        </form>
        <p className="composer-note">Enter to send <span>·</span> {selectedUser.isGroup ? 'A good group starts with listening' : 'Replies are just between you two'}</p>
      </div>
    </main>
  );
}

export default Messagearea;
