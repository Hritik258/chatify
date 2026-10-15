import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { serverUrl } from '../main';

export default function SignUp() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
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
      await axios.post(`${serverUrl}/api/auth/signup`, { userName, email, password }, { withCredentials: true });
      navigate('/login', { state: { notice: 'Your account is ready. Sign in to start chatting.' } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not reach Chatify. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page">
    <div className="auth-decoration auth-decoration--one" /><div className="auth-decoration auth-decoration--two" />
    <section className="auth-card auth-card--signup">
      <div className="auth-brand"><span className="brand-mark">c</span><span>chatify</span></div>
      <div className="auth-intro"><p className="eyebrow">YOUR PEOPLE, CLOSER</p><h1>Make space for<br /><em>good conversations.</em></h1><p>A little hello can turn into a lot.</p></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Username<input type="text" autoComplete="username" placeholder="How people will find you" value={userName} onChange={(event) => setUserName(event.target.value)} minLength={3} maxLength={24} required /></label>
        <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}</button></span><small className="field-hint">Use 8–128 characters.</small></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? <><span className="mini-spinner" /> Creating your account…</> : <>Create account <span>→</span></>}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in <span>↗</span></Link></p>
      <p className="auth-footnote"><span>✦</span> A calmer place for your conversations.</p>
    </section>
  </main>;
}
