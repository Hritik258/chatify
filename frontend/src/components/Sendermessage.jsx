import { useState } from 'react';
import dp from '../assets/dp.webp';
import { useSelector } from 'react-redux';

const Sendermessage = ({ messageItem, onEdit, onDelete, onReact, quickReactions, seenCount = 0 }) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
  const { userData } = useSelector((state) => state.user);
  const [showReactions, setShowReactions] = useState(false);
  const image = messageItem.deletedAt ? '' : messageItem.image;
  const message = messageItem.deletedAt ? 'This message was deleted' : messageItem.message;
  const getImageUrl = (value) => !value ? null : value.startsWith('http') ? value : `${serverUrl}${value}`;
  const reactions = (messageItem.reactions || []).reduce((groups, reaction) => {
    groups[reaction.emoji] = [...(groups[reaction.emoji] || []), reaction];
    return groups;
  }, {});

  return (
    <div className="message-row message-row--outgoing">
      <div className="message-content-wrap">
        <div className={`message-bubble message-bubble--outgoing ${messageItem.deletedAt ? 'message-bubble--deleted' : ''}`}>
          {image && <img src={getImageUrl(image)} alt="Sent attachment" className="message-image" onError={(event) => { event.currentTarget.src = dp; }} />}
          {message && <span>{message}</span>}
          {messageItem.editedAt && !messageItem.deletedAt && <small className="message-edited">edited</small>}
          <div className="message-actions">
            {!messageItem.deletedAt && <button type="button" onClick={() => setShowReactions((visible) => !visible)} aria-label="React to message">☺</button>}
            {!messageItem.deletedAt && <button type="button" onClick={() => onEdit(messageItem)} aria-label="Edit message">Edit</button>}
            {!messageItem.deletedAt && <button type="button" onClick={() => onDelete(messageItem)} aria-label="Delete message">Delete</button>}
            {showReactions && <span className="reaction-picker">{quickReactions.map((emoji) => <button type="button" key={emoji} onClick={() => { onReact(messageItem, emoji); setShowReactions(false); }}>{emoji}</button>)}</span>}
          </div>
          {Object.entries(reactions).map(([emoji, items]) => <button type="button" className="reaction-chip" key={emoji} onClick={() => onReact(messageItem, emoji)}>{emoji} {items.length}</button>)}
        </div>
        {seenCount > 0 && <small className="message-seen">Seen{seenCount > 1 ? ` by ${seenCount}` : ''}</small>}
      </div>
      <img src={getImageUrl(userData?.image) || dp} alt="You" className="message-avatar" onError={(event) => { event.currentTarget.src = dp; }} />
    </div>
  );
};

export default Sendermessage;
