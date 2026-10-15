import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiLogOutCircle } from 'react-icons/bi';
import { IoIosSearch } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { setOnlineUsers, setOtherUser, setSelectedUsers, setUserData } from '../redux/userSlice';
import { serverUrl } from '../main';
import dp from '../assets/dp.webp';

const isOnline = (onlineUsers, id) => onlineUsers?.some((entry) => typeof entry === 'string' ? entry === id : entry?._id === id);

function Sidebar({ socket }) {
  const { userData, otherUsers, selectedUser, onlineUsers } = useSelector((state) => state.user);
  const safeOtherUsers = Array.isArray(otherUsers) ? otherUsers : [];
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupModal, setGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupError, setGroupError] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    axios.get(`${serverUrl}/api/message/groups`, { withCredentials: true })
      .then(({ data }) => { if (active) setGroups(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const handleGroupCreated = (group) => setGroups((current) => current.some((entry) => entry._id === group._id) ? current : [group, ...current]);
    socket.on('groupCreated', handleGroupCreated);
    return () => socket.off('groupCreated', handleGroupCreated);
  }, [socket]);

  const term = search.trim().toLowerCase();
  const users = useMemo(() => [...safeOtherUsers]
    .filter((user) => !term || `${user.userName || ''} ${user.name || ''}`.toLowerCase().includes(term))
    .sort((a, b) => Number(isOnline(safeOnlineUsers, b._id)) - Number(isOnline(safeOnlineUsers, a._id))), [safeOtherUsers, safeOnlineUsers, term]);
  const visibleGroups = useMemo(() => groups.filter((group) => !term || group.name.toLowerCase().includes(term)), [groups, term]);
  const imageUrl = (image) => !image ? dp : image.startsWith('http') ? image : `${serverUrl}${image}`;

  const logout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
      dispatch(setUserData(null));
      dispatch(setOtherUser(null));
      dispatch(setSelectedUsers(null));
      dispatch(setOnlineUsers([]));
      navigate('/login');
    } catch {
      setLogoutError('Could not sign out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const toggleMember = (id) => setSelectedMembers((current) => current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id]);

  const createGroup = async (event) => {
    event.preventDefault();
    if (selectedMembers.length < 2) {
      setGroupError('Select at least two people to start a group.');
      return;
    }
    setCreatingGroup(true);
    setGroupError('');
    try {
      const { data } = await axios.post(`${serverUrl}/api/message/groups`, { name: groupName, participants: selectedMembers }, { withCredentials: true });
      setGroups((current) => [data, ...(Array.isArray(current) ? current : [])]);
      dispatch(setSelectedUsers(data));
      setGroupModal(false);
      setGroupName('');
      setSelectedMembers([]);
    } catch (requestError) {
      setGroupError(requestError.response?.data?.message || 'Could not create the group. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <>
      <aside className={`sidebar ${selectedUser ? 'sidebar--mobile-hidden' : ''}`}>
        <div className="sidebar-top">
          <div className="brand-lockup"><span className="brand-mark">c</span><span>chatify</span></div>
          <button className="avatar-button" onClick={() => navigate('/profile')} aria-label="Open profile" title="Your profile"><img src={imageUrl(userData?.image)} alt="" onError={(event) => { event.currentTarget.src = dp; }} /></button>
        </div>

        <section className="sidebar-welcome"><p className="eyebrow">YOUR SPACE</p><h1>Hey, {userData?.name || userData?.userName || 'there'} <span aria-hidden="true">✦</span></h1><p>Good conversations start here.</p></section>

        <section className="online-section" aria-label="Online contacts">
          <div className="section-heading"><span>Online now</span><span className="online-count">{safeOnlineUsers.filter((entry) => safeOtherUsers.some((user) => user._id === (typeof entry === 'string' ? entry : entry?._id))).length}</span></div>
          <div className="online-avatars">
            {safeOtherUsers.filter((user) => isOnline(safeOnlineUsers, user._id)).slice(0, 8).map((user) => <button className="online-avatar" key={user._id} title={user.userName} onClick={() => dispatch(setSelectedUsers(user))}><img src={imageUrl(user.image)} alt={user.userName} onError={(event) => { event.currentTarget.src = dp; }} /><span /></button>)}
            {!safeOnlineUsers.length && <span className="muted-copy">Friends online will appear here</span>}
          </div>
        </section>

        <section className="contacts-section">
          <div className="section-heading contacts-heading"><span>Messages</span><button type="button" onClick={() => { setGroupModal(true); setGroupError(''); }} className="new-group-button">+ New group</button></div>
          <label className="search-box"><IoIosSearch aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a conversation" aria-label="Search contacts and groups" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><RxCross2 /></button>}</label>
          <div className="contact-list">
            {visibleGroups.map((group) => <button key={group._id} className={`contact-row ${selectedUser?._id === group._id ? 'contact-row--active' : ''}`} onClick={() => dispatch(setSelectedUsers({ ...group, isGroup: true }))} aria-current={selectedUser?._id === group._id ? 'true' : undefined}><span className="group-avatar">👥</span><span className="contact-meta"><strong>{group.name}</strong><small>{group.participants?.length || 0} members · Group</small></span></button>)}
            {users.map((user) => {
              const online = isOnline(safeOnlineUsers, user._id);
              const active = !selectedUser?.isGroup && selectedUser?._id === user._id;
              return <button key={user._id} className={`contact-row ${active ? 'contact-row--active' : ''}`} onClick={() => dispatch(setSelectedUsers(user))} aria-current={active ? 'true' : undefined}>
                <span className="contact-avatar"><img src={imageUrl(user.image)} alt="" onError={(event) => { event.currentTarget.src = dp; }} /><i className={online ? 'is-online' : ''} /></span>
                <span className="contact-meta"><strong>{user.name || user.userName}</strong><small>{online ? 'Online' : 'Start a conversation'}</small></span>
                {online && <span className="presence-dot" aria-label="Online" />}
              </button>;
            })}
            {visibleGroups.length === 0 && users.length === 0 && <div className="empty-contacts"><span>⌕</span><strong>{search ? 'No matches found' : 'No conversations yet'}</strong><small>{search ? 'Try another name or username.' : 'When people join, they’ll show up here.'}</small></div>}
          </div>
        </section>

        <footer className="sidebar-footer"><div className="signed-in"><span className="mini-avatar"><img src={imageUrl(userData?.image)} alt="" onError={(event) => { event.currentTarget.src = dp; }} /></span><span><strong>{userData?.name || userData?.userName}</strong><small>Signed in</small></span></div><button className="icon-button logout-button" onClick={logout} disabled={loggingOut} aria-label="Sign out" title="Sign out"><BiLogOutCircle /></button></footer>
        {logoutError && <p className="sidebar-error" role="alert">{logoutError}</p>}
      </aside>

      {groupModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGroupModal(false); }}>
        <form className="group-modal" onSubmit={createGroup}>
          <div className="group-modal-heading"><div><p className="eyebrow">MAKE A SPACE TOGETHER</p><h2>New group</h2></div><button type="button" onClick={() => setGroupModal(false)} aria-label="Close">×</button></div>
          <label className="group-name-field">Group name<input required minLength={2} maxLength={60} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Weekend plans" /></label>
          <p className="group-members-title">Add people <span>{selectedMembers.length} selected</span></p>
          <div className="group-member-list">{safeOtherUsers.map((user) => <label className="group-member-choice" key={user._id}><input type="checkbox" checked={selectedMembers.includes(user._id)} onChange={() => toggleMember(user._id)} /><img src={imageUrl(user.image)} alt="" onError={(event) => { event.currentTarget.src = dp; }} /><span>{user.name || user.userName}<small>@{user.userName}</small></span></label>)}</div>
          {groupError && <p className="composer-error" role="alert">{groupError}</p>}
          <button className="profile-submit" type="submit" disabled={creatingGroup}>{creatingGroup ? 'Creating…' : 'Create group'}</button>
        </form>
      </div>}
    </>
  );
}

export default Sidebar;
