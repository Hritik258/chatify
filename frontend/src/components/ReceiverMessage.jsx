import { useState } from 'react';
import dp from '../assets/dp.webp';

const ReceiverMessage = ({ messageItem, profileImage, senderName, onReact, quickReactions }) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
  const [showReactions, setShowReactions] = useState(false);
  const image = messageItem.deletedAt ? '' : messageItem.image;
  const message = messageItem.deletedAt ? 'This message was deleted' : messageItem.message;
  const getImageUrl = (value) => !value ? null : value.startsWith('http') ? value : `${serverUrl}${value}`;
  const reactions = (messageItem.reactions || []).reduce((groups, reaction) => {
    groups[reaction.emoji] = [...(groups[reaction.emoji] || []), reaction];
    return groups;
  }, {});

  return (
    <div className="message-row message-row--incoming">
      <img src={getImageUrl(profileImage) || dp} alt={senderName || 'Chat member'} className="message-avatar" onError={(event) => { event.currentTarget.src = dp; }} />
      <div className="message-content-wrap">
        <div className={`message-bubble message-bubble--incoming ${messageItem.deletedAt ? 'message-bubble--deleted' : ''}`}>
          {senderName && <strong className="message-author">{senderName}</strong>}
          {image && <img src={getImageUrl(image)} alt="Sent attachment" className="message-image" onError={(event) => { event.currentTarget.src = dp; }} />}
          {message && <span>{message}</span>}
          {messageItem.editedAt && !messageItem.deletedAt && <small className="message-edited">edited</small>}
          <div className="message-actions">
            {!messageItem.deletedAt && <button type="button" onClick={() => setShowReactions((visible) => !visible)} aria-label="React to message">☺</button>}
            {showReactions && <span className="reaction-picker">{quickReactions.map((emoji) => <button type="button" key={emoji} onClick={() => { onReact(messageItem, emoji); setShowReactions(false); }}>{emoji}</button>)}</span>}
          </div>
          {Object.entries(reactions).map(([emoji, items]) => <button type="button" className="reaction-chip" key={emoji} onClick={() => onReact(messageItem, emoji)}>{emoji} {items.length}</button>)}
        </div>
      </div>
    </div>
  );
};

export default ReceiverMessage;
