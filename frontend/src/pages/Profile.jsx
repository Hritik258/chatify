import { useEffect, useRef, useState } from 'react';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { IoCameraOutline } from 'react-icons/io5';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import dp from '../assets/dp.webp';
import { setUserData } from '../redux/userSlice';
import { serverUrl } from '../main';

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [name, setName] = useState(userData?.name || '');
  const [profileImage, setProfileImage] = useState(userData?.image || dp);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!profileImage.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(profileImage);
  }, [profileImage]);

  if (!userData) return <Navigate to="/login" replace />;

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, GIF, or WebP image smaller than 5 MB.');
      event.target.value = '';
      return;
    }
    setError('');
    setImageFile(file);
    setProfileImage(URL.createObjectURL(file));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (imageFile) formData.append('image', imageFile);
      const result = await axios.put(`${serverUrl}/api/user/profile`, formData, { withCredentials: true });
      dispatch(setUserData(result.data));
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Your profile could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const avatar = profileImage?.startsWith('blob:') || profileImage?.startsWith('data:') || profileImage?.startsWith('http') ? profileImage : `${serverUrl}${profileImage}`;

  return <main className="profile-page"><section className="profile-card">
    <button className="profile-back" onClick={() => navigate('/')}><IoIosArrowRoundBack size={22} /> Back to chats</button>
    <div className="auth-intro" style={{ marginTop: 25 }}><p className="eyebrow">MAKE IT YOURS</p><h1>Your profile</h1><p>Let your friends know it’s you.</p></div>
    <button type="button" className="profile-photo" onClick={() => inputRef.current?.click()} aria-label="Choose profile photo"><img src={avatar} alt="Profile preview" onError={(event) => { event.currentTarget.src = dp; }} /><span><IoCameraOutline /></span></button>
    <form className="profile-form" onSubmit={saveProfile}>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={chooseImage} />
      <label>Display name<input type="text" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
      <label>Username<input type="text" value={userData.userName || ''} disabled /></label>
      <label>Email address<input type="email" value={userData.email || ''} disabled /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="profile-submit" type="submit" disabled={saving}>{saving ? 'Saving your changes…' : 'Save changes'}</button>
    </form>
  </section></main>;
}
