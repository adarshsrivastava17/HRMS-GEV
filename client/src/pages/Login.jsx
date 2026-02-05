import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { authAPI } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    position: ''
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const dashboards = { admin: '/admin', manager: '/manager', hr: '/hr', employee: '/employee' };
      navigate(dashboards[user.role] || '/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/password-reset/request', { email: forgotEmail });
      setSuccess('Password reset request submitted!');
      setShowForgot(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        phone: regForm.phone || null,
        position: regForm.position || null
      });
      setSuccess('Registration successful! Please wait for HR approval before logging in.');
      setShowRegister(false);
      setRegForm({ name: '', email: '', password: '', confirmPassword: '', phone: '', position: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="bg-layer">
        <div className="gradient-bg"></div>
        <div className="orbs">
          <div className="orb o1"></div>
          <div className="orb o2"></div>
          <div className="orb o3"></div>
        </div>
      </div>

      {/* Content */}
      <div className="login-wrapper">
        {/* Left - Brand */}
        <div className="brand-side">
          <div className="brand-box">
            <div className="logo-row">
              <img src="/gev-logo.png" alt="GEV Logo" className="logo-icon" />
              <span className="logo-name">GEV</span>
            </div>
            <h2>Human Resource Management System</h2>
            <p>Manage your workforce efficiently with our powerful suite of HR tools.</p>
            <ul className="features">
              <li><span>✓</span> Attendance Tracking</li>
              <li><span>✓</span> Leave Management</li>
              <li><span>✓</span> Payroll Processing</li>
              <li><span>✓</span> Performance Reviews</li>
            </ul>
          </div>
        </div>

        {/* Right - Form */}
        <div className="form-side">
          <div className="form-box">
            <h1>{showRegister ? 'Create Account' : showForgot ? 'Reset Password' : 'Welcome Back'}</h1>
            <p className="subtitle">{showRegister ? 'Register as a new employee' : showForgot ? 'Enter email to request reset' : 'Sign in to your dashboard'}</p>

            {error && <div className="msg error">{error}</div>}
            {success && <div className="msg success">{success}</div>}

            {showRegister ? (
              <form onSubmit={handleRegister}>
                <label>Full Name *</label>
                <div className="input-wrap">
                  <span>👤</span>
                  <input type="text" placeholder="Enter your full name" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} required />
                </div>

                <label>Email *</label>
                <div className="input-wrap">
                  <span>📧</span>
                  <input type="email" placeholder="Enter your email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                </div>

                <label>Password *</label>
                <div className="input-wrap">
                  <span>🔒</span>
                  <input type="password" placeholder="Create a password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
                </div>

                <label>Confirm Password *</label>
                <div className="input-wrap">
                  <span>🔒</span>
                  <input type="password" placeholder="Confirm your password" value={regForm.confirmPassword} onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })} required />
                </div>

                <label>Phone (Optional)</label>
                <div className="input-wrap">
                  <span>📱</span>
                  <input type="tel" placeholder="Enter your phone number" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
                </div>

                <label>Position (Optional)</label>
                <div className="input-wrap">
                  <span>💼</span>
                  <input type="text" placeholder="Your job position" value={regForm.position} onChange={e => setRegForm({ ...regForm, position: e.target.value })} />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Registering...' : 'Register →'}</button>
                <button type="button" className="back" onClick={() => { setShowRegister(false); setError(''); }}>← Back to Login</button>
              </form>
            ) : !showForgot ? (
              <form onSubmit={handleSubmit}>
                <label>Email</label>
                <div className="input-wrap">
                  <span>📧</span>
                  <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <label>Password</label>
                <div className="input-wrap">
                  <span>🔒</span>
                  <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                <button type="button" className="forgot" onClick={() => setShowForgot(true)}>Forgot Password?</button>
                <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign In →'}</button>
                <button type="button" className="register-link" onClick={() => { setShowRegister(true); setError(''); setSuccess(''); }}>New Employee? Register Here</button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <label>Email</label>
                <div className="input-wrap">
                  <span>📧</span>
                  <input type="email" placeholder="Enter your email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                </div>
                <button type="submit" className="submit-btn">Submit Request</button>
                <button type="button" className="back" onClick={() => setShowForgot(false)}>← Back to Login</button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .login-page {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          font-family: 'Inter', sans-serif;
          color: white;
          overflow: hidden;
        }

        .bg-layer {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .gradient-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
        }

        .orbs { position: absolute; inset: 0; overflow: hidden; }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.4; }
        .o1 { width: 600px; height: 600px; background: #667eea; top: -20%; left: -10%; }
        .o2 { width: 500px; height: 500px; background: #f093fb; bottom: -20%; right: -10%; }
        .o3 { width: 400px; height: 400px; background: #4facfe; top: 40%; left: 50%; }

        .login-wrapper {
          position: relative;
          z-index: 10;
          display: flex;
          width: 100%;
          height: 100%;
        }

        .brand-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .brand-box { max-width: 450px; }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .logo-icon {
          width: 70px;
          height: 70px;
          object-fit: contain;
          filter: brightness(0) invert(1) drop-shadow(0 15px 40px rgba(102, 126, 234, 0.5));
        }

        .logo-name {
          font-size: 52px;
          font-weight: 800;
          background: linear-gradient(to right, #667eea, #f093fb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-box h2 {
          font-size: 26px;
          font-weight: 600;
          color: #a0aec0;
          margin-bottom: 16px;
        }

        .brand-box > p {
          font-size: 15px;
          color: #718096;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .features li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: #a0aec0;
        }

        .features li span {
          width: 26px;
          height: 26px;
          background: linear-gradient(135deg, #38ef7d, #11998e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .form-side {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px;
          background: rgba(0,0,0,0.2);
          overflow-y: auto;
          max-height: 100vh;
        }

        .form-box {
          width: 100%;
          max-width: 400px;
        }

        .form-box h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #718096;
          margin-bottom: 28px;
          font-size: 14px;
        }

        .msg {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .msg.error { background: rgba(235,51,73,0.15); border: 1px solid rgba(235,51,73,0.3); color: #fca5a5; }
        .msg.success { background: rgba(56,239,125,0.15); border: 1px solid rgba(56,239,125,0.3); color: #86efac; }

        label {
          display: block;
          font-size: 13px;
          color: #a0aec0;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0 14px;
          margin-bottom: 20px;
          transition: 0.3s;
        }

        .input-wrap:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
        }

        .input-wrap span { font-size: 16px; margin-right: 10px; }

        .input-wrap input {
          flex: 1;
          padding: 14px 0;
          font-size: 14px;
          background: none;
          border: none;
          color: white;
          outline: none;
        }

        .input-wrap input::placeholder { color: #4a5568; }

        .forgot {
          display: block;
          width: 100%;
          text-align: right;
          font-size: 13px;
          color: #667eea;
          background: none;
          border: none;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .forgot:hover { color: #f093fb; }

        .submit-btn {
          width: 100%;
          padding: 16px;
          font-size: 15px;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 8px 30px rgba(102,126,234,0.4);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(102,126,234,0.5);
        }

        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .back {
          width: 100%;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          color: #a0aec0;
          border-radius: 10px;
          cursor: pointer;
        }

        .back:hover { background: rgba(255,255,255,0.05); }

        .register-link {
          display: block;
          width: 100%;
          padding: 14px;
          margin-top: 16px;
          font-size: 14px;
          background: none;
          border: 1px solid rgba(102,126,234,0.4);
          color: #667eea;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.3s;
        }

        .register-link:hover {
          background: rgba(102,126,234,0.1);
          border-color: #667eea;
        }

        /* Tablet and Mobile */
        @media (max-width: 900px) {
          .login-wrapper { flex-direction: column; }
          .brand-side { flex: 0; padding: 30px 20px; }
          .brand-box { text-align: center; max-width: 100%; }
          .logo-row { justify-content: center; }
          .features { display: none; }
          .form-side { flex: 1; padding: 30px 20px; }
          .form-box { max-width: 100%; }
          .brand-box h2 { font-size: 20px; }
          .brand-box > p { font-size: 14px; margin-bottom: 20px; }
          .logo-name { font-size: 40px; }
          .logo-icon { width: 56px; height: 56px; font-size: 28px; }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .login-page { overflow-y: auto; position: relative; height: auto; min-height: 100vh; }
          .login-wrapper { min-height: 100vh; }
          .brand-side { padding: 25px 15px 15px; }
          .form-side { padding: 20px 15px 30px; background: transparent; }
          .logo-row { gap: 12px; margin-bottom: 16px; }
          .logo-icon { width: 48px; height: 48px; font-size: 24px; border-radius: 14px; }
          .logo-name { font-size: 32px; }
          .brand-box h2 { font-size: 16px; margin-bottom: 8px; }
          .brand-box > p { display: none; }
          .form-box h1 { font-size: 26px; }
          .subtitle { font-size: 13px; margin-bottom: 20px; }
          .msg { padding: 10px 14px; font-size: 13px; }
          label { font-size: 12px; margin-bottom: 6px; }
          .input-wrap { padding: 0 12px; margin-bottom: 16px; }
          .input-wrap input { padding: 12px 0; font-size: 14px; }
          .input-wrap span { font-size: 14px; margin-right: 8px; }
          .forgot { font-size: 12px; margin-bottom: 16px; }
          .submit-btn { padding: 14px; font-size: 14px; }
          .back { padding: 10px; font-size: 12px; }
          .quick { margin-top: 24px; padding-top: 20px; }
          .quick > p { font-size: 10px; letter-spacing: 1.5px; margin-bottom: 12px; }
          .quick-btns { grid-template-columns: 1fr 1fr; gap: 8px; }
          .q { padding: 8px; font-size: 11px; }
        }

        /* Very small mobile */
        @media (max-width: 380px) {
          .brand-side { padding: 20px 12px 10px; }
          .form-side { padding: 15px 12px 25px; }
          .logo-icon { width: 40px; height: 40px; font-size: 20px; }
          .logo-name { font-size: 28px; }
          .form-box h1 { font-size: 22px; }
          .input-wrap input { font-size: 13px; }
          .submit-btn { padding: 12px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
