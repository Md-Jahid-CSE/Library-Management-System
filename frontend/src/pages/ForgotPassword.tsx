import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

type Step = 'email' | 'code' | 'password';

export default function ForgotPassword() {
  const [step, setStep]           = useState<Step>('email');
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState(['', '', '', '', '', '']);
  const [newPass, setNewPass]     = useState('');
  const [confirmPass, setConfirm] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [scale, setScale]         = useState(1);
  const [resendTimer, setTimer]   = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let dir = 1;
    const id = setInterval(() => {
      setScale(s => {
        const n = s + dir * 0.0007;
        if (n >= 1.12) dir = -1;
        if (n <= 1.00) dir = 1;
        return parseFloat(n.toFixed(4));
      });
    }, 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setTimer(v => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setStep('code');
      setTimer(60);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleCodeChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs.current[i - 1]?.focus();
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      codeRefs.current[5]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = code.join('');
    if (codeStr.length < 6) { setError('Please enter the 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/verify-reset-code', { email, code: codeStr });
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setCode(['', '', '', '', '', '']);
      setTimer(60);
      codeRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { email, code: code.join(''), newPassword: newPass });
      setSuccess('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const stepLabel = step === 'email' ? 'Reset Password' : step === 'code' ? 'Enter Code' : 'New Password';

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .fi:focus { border-color: #c9a84c !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.2) !important; outline: none; }
        .fi::placeholder { color: rgba(255,255,255,0.22) !important; }
        .fbtn:hover:not(:disabled) { background: #d4b55a !important; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(201,168,76,0.45) !important; }
        .fbtn:disabled { opacity: .65; cursor: not-allowed; }
        .card-up { animation: cUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes cUp { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: translateY(0) } }
        .code-box:focus { border-color: #c9a84c !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.25) !important; outline: none; background: rgba(201,168,76,0.08) !important; }
        .rlink:hover { opacity: .7; }
        .resend-btn:hover:not(:disabled) { color: #d4b55a !important; }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(/library-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', transform: `scale(${scale})`, filter: 'brightness(0.42)', transition: 'transform .1s linear', willChange: 'transform' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.68) 100%)' }} />

      <div className="card-up" style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 460, margin: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
          Bangladesh Army University of Science and Technology
        </p>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 48, fontWeight: 700, color: '#fff', margin: '0 0 8px', textAlign: 'center', letterSpacing: '-1px', lineHeight: 1 }}>
          LibraryMS
        </h1>
        <div style={{ width: 50, height: 2, background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)', margin: '0 auto 32px' }} />

        <div style={{ width: '100%', background: 'rgba(12,12,22,0.7)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '40px 38px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)' }}>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
            {(['email', 'code', 'password'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: step === s ? '#c9a84c' : ((['email', 'code', 'password'].indexOf(step) > i) ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'), color: step === s ? '#1a1a2e' : ((['email', 'code', 'password'].indexOf(step) > i) ? '#c9a84c' : 'rgba(255,255,255,0.35)'), border: `2px solid ${step === s ? '#c9a84c' : ((['email', 'code', 'password'].indexOf(step) > i) ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)')}`, transition: 'all .3s' }}>
                  {['email', 'code', 'password'].indexOf(step) > i ? <span style={{ fontSize:14, lineHeight:1 }}>&#10003;</span> : i + 1}
                </div>
                {i < 2 && <div style={{ width: 40, height: 2, background: (['email', 'code', 'password'].indexOf(step) > i) ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)', transition: 'all .3s' }} />}
              </React.Fragment>
            ))}
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>{stepLabel}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', margin: '0 0 26px', textAlign: 'center' }}>
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'code' && `Code sent to ${email}`}
            {step === 'password' && 'Choose a strong new password'}
          </p>

          {error && (
            <div role="alert" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', marginTop: 6, flexShrink: 0 }}/>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div role="status" style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', color: '#6ee7b7', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', marginTop: 6, flexShrink: 0 }}/>
              <span>{success}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 9, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Email Address
                </label>
                <input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value.toLowerCase())} placeholder="your@email.com" required
                  style={{ width: '100%', padding: '15px 18px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 13, fontSize: 16, color: '#fff', fontFamily: 'inherit', outline: 'none', transition: 'all .2s' }} />
              </div>
              <button type="submit" disabled={loading} className="fbtn"
                style={{ width: '100%', padding: '16px', background: '#c9a84c', color: '#1a1a2e', border: 'none', borderRadius: 13, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s', boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}>
                {loading ? 'Sending...' : 'Send reset code'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode}>
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>
                  6-Digit Code
                </label>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input key={i} ref={el => { codeRefs.current[i] = el; }} className="code-box" type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      style={{ width: 52, height: 62, textAlign: 'center', fontSize: 26, fontWeight: 700, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#c9a84c', fontFamily: 'inherit', outline: 'none', transition: 'all .2s' }} />
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" className="resend-btn" onClick={handleResend} disabled={resendTimer > 0}
                    style={{ background: 'none', border: 'none', color: resendTimer > 0 ? 'rgba(255,255,255,0.25)' : '#c9a84c', fontSize: 14, cursor: resendTimer > 0 ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'color .2s' }}>
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || code.join('').length < 6} className="fbtn"
                style={{ width: '100%', padding: '16px', background: '#c9a84c', color: '#1a1a2e', border: 'none', borderRadius: 13, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s', boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}>
                {loading ? 'Verifying...' : 'Verify code'}
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 9, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input className="fi" type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" required minLength={6}
                    style={{ width: '100%', padding: '15px 50px 15px 18px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 13, fontSize: 16, color: '#fff', fontFamily: 'inherit', outline: 'none', transition: 'all .2s' }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: '6px 10px', borderRadius: 6, fontFamily: 'inherit' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 26 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 9, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Confirm Password
                </label>
                <input className="fi" type={showPass ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', padding: '15px 18px', background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${confirmPass && confirmPass !== newPass ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 13, fontSize: 16, color: '#fff', fontFamily: 'inherit', outline: 'none', transition: 'all .2s' }} />
                {confirmPass && confirmPass !== newPass && (
                  <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 6 }}>Passwords do not match</p>
                )}
              </div>
              <button type="submit" disabled={loading || !newPass || newPass !== confirmPass} className="fbtn"
                style={{ width: '100%', padding: '16px', background: '#c9a84c', color: '#1a1a2e', border: 'none', borderRadius: 13, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s', boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 15, color: 'rgba(255,255,255,0.35)', marginTop: 22 }}>
            <Link to="/login" className="rlink" style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none', transition: 'opacity .2s' }}>Back to sign in</Link>
          </p>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20, letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'center' }}>
          BAUST · Library Management System
        </p>
      </div>
    </div>
  );
}
