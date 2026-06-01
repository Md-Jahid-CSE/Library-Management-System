import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', width:'100%', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif", overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; }
        .li:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.2) !important; outline:none; }
        .li::placeholder { color:rgba(255,255,255,0.22) !important; }
        .lbtn:hover:not(:disabled) { background:#d4b55a !important; transform:translateY(-2px); box-shadow:0 12px 32px rgba(201,168,76,0.45) !important; }
        .lbtn:disabled { opacity:.65; cursor:not-allowed; }
        .card-up { animation:cUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes cUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes loginBgZoom { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        .login-bg { animation: loginBgZoom 30s ease-in-out infinite; will-change: transform; }
        .eye-btn:hover { color:rgba(255,255,255,0.85) !important; }
        a.rlink:hover { opacity:.7; }
      `}</style>

      {/* BG */}
      <div className="login-bg" style={{ position:'absolute', inset:0, zIndex:0, backgroundImage:'url(/library-bg.jpg)', backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(0.42)' }} />
      {/* Vignette */}
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.68) 100%)' }} />

      {/* Content */}
      <div className="card-up" style={{ position:'relative', zIndex:2, width:'100%', maxWidth:460, margin:'0 20px', display:'flex', flexDirection:'column', alignItems:'center' }}>

        {/* University */}
        <p style={{ fontSize:13, fontWeight:600, letterSpacing:'1.5px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', marginBottom:10, textAlign:'center' }}>
          Bangladesh Army University of Science and Technology
        </p>

        {/* Title */}
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:48, fontWeight:700, color:'#fff', margin:'0 0 8px', textAlign:'center', letterSpacing:'-1px', lineHeight:1 }}>
          LibraryMS
        </h1>

        {/* Gold line */}
        <div style={{ width:50, height:2, background:'linear-gradient(90deg,transparent,#c9a84c,transparent)', margin:'0 auto 32px' }} />

        {/* Glass Card */}
        <div style={{ width:'100%', background:'rgba(12,12,22,0.7)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'40px 38px 32px', boxShadow:'0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)' }}>

          <h2 style={{ fontSize:28, fontWeight:700, color:'#fff', margin:'0 0 8px', textAlign:'center' }}>Welcome back</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.38)', margin:'0 0 30px', textAlign:'center' }}>Sign in to access your library account</p>

          {error && (
            <div style={{ background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.35)', color:'#fca5a5', padding:'12px 16px', borderRadius:11, fontSize:14, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#fca5a5', flexShrink:0 }}/> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:9, letterSpacing:'1px', textTransform:'uppercase' }}>
                Email Address
              </label>
              <input className="li" type="email" value={email} onChange={e=>setEmail(e.target.value.toLowerCase())} placeholder="your@email.com" required
                style={{ width:'100%', padding:'15px 18px', background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:13, fontSize:16, color:'#fff', fontFamily:'inherit', outline:'none', transition:'all .2s', boxSizing:'border-box' }} />
            </div>

            <div style={{ marginBottom:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'1px', textTransform:'uppercase' }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize:12, color:'#c9a84c', textDecoration:'none', fontWeight:600, opacity:.85, transition:'opacity .2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='.85')}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position:'relative' }}>
                <input className="li" type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width:'100%', padding:'15px 60px 15px 18px', background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:13, fontSize:16, color:'#fff', fontFamily:'inherit', outline:'none', transition:'all .2s', boxSizing:'border-box' }} />
                <button type="button" className="eye-btn" onClick={()=>setShowPass(v=>!v)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:12, fontWeight:600, padding:'4px 8px', borderRadius:6, fontFamily:'inherit', transition:'color .2s' }}>
                  {showPass?'Hide':'Show'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="lbtn"
              style={{ width:'100%', padding:'16px', background:'#c9a84c', color:'#1a1a2e', border:'none', borderRadius:13, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .25s', boxShadow:'0 4px 20px rgba(201,168,76,0.3)', letterSpacing:'0.3px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:15, color:'rgba(255,255,255,0.35)', marginTop:22 }}>
            New student or staff?{' '}
            <Link to="/register" className="rlink" style={{ color:'#c9a84c', fontWeight:700, textDecoration:'none', transition:'opacity .2s' }}>Create Account</Link>
          </p>
        </div>

        <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:20, letterSpacing:'1.5px', textTransform:'uppercase', textAlign:'center' }}>
          BAUST · Library Management System
        </p>
      </div>
    </div>
  );
}
