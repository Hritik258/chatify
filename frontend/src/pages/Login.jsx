import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { setUserData } from '../redux/userSlice';
import { serverUrl } from '../main';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await axios.post(`${serverUrl}/api/auth/login`, { email, password }, { withCredentials: true });
      dispatch(setUserData(result.data));
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not reach Chatify. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page">
    <div className="auth-decoration auth-decoration--one" /><div className="auth-decoration auth-decoration--two" />
    <section className="auth-card">
      <div className="auth-brand"><span className="brand-mark">c</span><span>chatify</span></div>
      <div className="auth-intro"><p className="eyebrow">WELCOME BACK</p><h1>Good to see<br /><em>you again.</em></h1><p>Your people are just a message away.</p></div>
      {location.state?.notice && <p className="form-success" role="status">{location.state.notice}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}</button></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? <><span className="mini-spinner" /> Signing you in…</> : <>Sign in <span>→</span></>}</button>
      </form>
      <p className="auth-switch">New to Chatify? <Link to="/signup">Create an account <span>↗</span></Link></p>
      <p className="auth-footnote"><span>✦</span> A calmer place for your conversations.</p>
    </section>
  </main>;
}
