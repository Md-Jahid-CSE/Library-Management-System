import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({
    account_type: 'student', member_id: '', name: '', email: '',
    password: '', confirm_password: '', department: '', batch: '',
    mobile: '', address: '', gender: ''
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [scale, setScale] = useState(1);
  const navigate = useNavigate();
  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  useEffect(() => {
    let dir = 1;
    const id = setInterval(() => {
      setScale(s => { const n = s + dir * 0.0007; if (n >= 1.1) dir = -1; if (n <= 1.0) dir = 1; return parseFloat(n.toFixed(4)); });
    }, 30);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Account created. Please wait for librarian approval — redirecting to sign in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (e: any) { setError(e.response?.data?.message || 'Registration failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 11, fontSize: 14.5, color: '#fff',
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .15s, box-shadow .15s, background .15s',
    boxSizing: 'border-box'
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11.5, fontWeight: 600,
    color: 'rgba(255,255,255,0.55)', marginBottom: 7,
    letterSpacing: '0.06em', textTransform: 'uppercase'
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", overflow: 'hidden', padding: '28px 20px'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .ri:focus { border-color: #c9a84c !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.18) !important; outline: none; background: rgba(255,255,255,0.08) !important; }
        .ri::placeholder { color: rgba(255,255,255,0.28) !important; }
        .rbtn:hover:not(:disabled) { background: #d4b55a !important; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.4) !important; }
        .rbtn:disabled { opacity: .55; cursor: not-allowed; }
        .card-up { animation: cUp .55s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes cUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .ttype:hover { border-color: rgba(201,168,76,0.5) !important; background: rgba(255,255,255,0.07) !important; }
        .eye2:hover { color: rgba(255,255,255,0.85) !important; background: rgba(255,255,255,0.06) !important; }
      `}</style>

      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/library-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center',
        transform: `scale(${scale})`, filter: 'brightness(0.4)',
        transition: 'transform .1s linear', willChange: 'transform'
      }}/>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)' }}/>

      <div className="card-up" style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 540,
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>

        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
          marginBottom: 10, textAlign: 'center' }}>
          Bangladesh Army University of Science and Technology
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700,
          color: '#fff', margin: '0 0 6px', textAlign: 'center', letterSpacing: '-1px', lineHeight: 1 }}>
          LibraryMS
        </h1>
        <div style={{ width: 50, height: 2,
          background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', margin: '0 auto 24px' }}/>

        {/* Glass card */}
        <div style={{
          width: '100%',
          background: 'rgba(12,12,22,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22,
          padding: '32px 32px 26px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)'
        }}>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', textAlign: 'center', letterSpacing: '-0.3px' }}>
            Create your account
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center' }}>
            Register to access the library catalogue and borrow books.
          </p>

          {error && (
            <div role="alert" style={{
              background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
              color: '#fca5a5', padding: '10px 14px', borderRadius: 9,
              fontSize: 13.5, marginBottom: 16,
              display: 'flex', alignItems: 'flex-start', gap: 10
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', marginTop: 6, flexShrink: 0 }}/>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div role="status" style={{
              background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
              color: '#6ee7b7', padding: '10px 14px', borderRadius: 9,
              fontSize: 13.5, marginBottom: 16,
              display: 'flex', alignItems: 'flex-start', gap: 10
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', marginTop: 6, flexShrink: 0 }}/>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Account type */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Account type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { key: 'student', label: 'Student', hint: 'Enrolled at BAUST' },
                  { key: 'staff',   label: 'Staff',   hint: 'University employee' },
                ].map(t => {
                  const active = form.account_type === t.key;
                  return (
                    <button key={t.key} type="button" className="ttype"
                      onClick={() => set('account_type', t.key)}
                      style={{
                        flex: 1, padding: '11px 14px', textAlign: 'left',
                        border: `1.5px solid ${active ? '#c9a84c' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 11,
                        background: active ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#c9a84c' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all .15s'
                      }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                      <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 1 }}>{t.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>{form.account_type === 'student' ? 'Student ID' : 'Staff ID'} *</label>
                <input className="ri" style={inp} value={form.member_id}
                  onChange={e => set('member_id', e.target.value)}
                  placeholder={form.account_type === 'student' ? '20210101' : 'STF001'} required />
              </div>
              <div>
                <label style={lbl}>Full name *</label>
                <input className="ri" style={inp} value={form.name}
                  onChange={e => set('name', e.target.value)} placeholder="Your full name" required />
              </div>
              <div>
                <label style={lbl}>Department *</label>
                <input className="ri" style={inp} value={form.department}
                  onChange={e => set('department', e.target.value)} placeholder="e.g. CSE" required />
              </div>
              {form.account_type === 'student' ? (
                <div>
                  <label style={lbl}>Batch *</label>
                  <input className="ri" style={inp} value={form.batch}
                    onChange={e => set('batch', e.target.value)} placeholder="e.g. 2021" required />
                </div>
              ) : <div />}
              <div>
                <label style={lbl}>Mobile *</label>
                <input className="ri" style={inp} value={form.mobile}
                  onChange={e => set('mobile', e.target.value)} placeholder="01XXXXXXXXX" required />
              </div>
              <div>
                <label style={lbl}>Gender *</label>
                <select className="ri" style={{ ...inp, appearance: 'none' as any, paddingRight: 36 }}
                  value={form.gender} onChange={e => set('gender', e.target.value)} required>
                  <option value="" style={{ background: '#1a1a2e' }}>Select gender</option>
                  <option value="male"   style={{ background: '#1a1a2e' }}>Male</option>
                  <option value="female" style={{ background: '#1a1a2e' }}>Female</option>
                  <option value="other"  style={{ background: '#1a1a2e' }}>Other</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Email address *</label>
                <input className="ri" style={inp} type="email" value={form.email}
                  onChange={e => set('email', e.target.value.toLowerCase())} placeholder="you@example.com" required />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={lbl}>Password *</label>
                <input className="ri" style={{ ...inp, paddingRight: 64 }}
                  type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min. 6 characters" required />
                <button type="button" className="eye2" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 8, bottom: 7,
                    background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                    fontSize: 11.5, fontWeight: 500, padding: '6px 10px',
                    borderRadius: 6, fontFamily: 'inherit', transition: 'all .15s' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={lbl}>Confirm password *</label>
                <input className="ri" style={{ ...inp, paddingRight: 64 }}
                  type={showPass2 ? 'text' : 'password'} value={form.confirm_password}
                  onChange={e => set('confirm_password', e.target.value)}
                  placeholder="Repeat password" required />
                <button type="button" className="eye2" onClick={() => setShowPass2(v => !v)}
                  style={{ position: 'absolute', right: 8, bottom: 7,
                    background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                    fontSize: 11.5, fontWeight: 500, padding: '6px 10px',
                    borderRadius: 6, fontFamily: 'inherit', transition: 'all .15s' }}>
                  {showPass2 ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Address <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                <textarea className="ri" style={{ ...inp, minHeight: 70, resize: 'vertical' }}
                  value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="Your full address" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="rbtn"
              style={{
                width: '100%', padding: '14px', marginTop: 22,
                background: '#c9a84c', color: '#1a1a2e', border: 'none', borderRadius: 11,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all .2s',
                boxShadow: '0 4px 16px rgba(201,168,76,0.25)'
              }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.4)', marginTop: 18 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>

          <div style={{
            marginTop: 14,
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.18)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a84c', marginTop: 6, flexShrink: 0 }}/>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              After registration, your account requires{' '}
              <strong style={{ color: '#c9a84c', fontWeight: 600 }}>librarian approval</strong>{' '}
              before you can sign in.
            </p>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16,
          letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center' }}>
          BAUST · Library Management System
        </p>
      </div>
    </div>
  );
}
