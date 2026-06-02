import React, { useState } from 'react';
import api from '../utils/api';
import Alert from '../components/Alert';

export default function CreateAssistant() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm_password: '',
    mobile: '', gender: '', address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/create-assistant', form);
      setSuccess(`Library Assistant account for "${form.name}" was created successfully.`);
      setForm({ name: '', email: '', password: '', confirm_password: '', mobile: '', gender: '', address: '' });
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to create account.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>People · Administration</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color:'var(--text)', letterSpacing:'-0.4px' }}>
          Create Library Assistant
        </h1>
        <p style={{ fontSize: 13, color:'var(--text-muted)', marginTop: 4 }}>
          Create an assistant account that can manage day-to-day library operations.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap: 20, alignItems:'start' }}>

        {/* Form */}
        <div className="card">
          <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color:'var(--text)' }}>Account details</h2>
            <p style={{ fontSize: 12.5, color:'var(--text-muted)', marginTop: 2 }}>
              The assistant will receive sign-in credentials. They can change their password later.
            </p>
          </div>

          <div style={{ padding: 22 }}>
            {error   && <Alert type="error"   title="Couldn't create the account" message={error}   onClose={() => setError('')}   style={{ marginBottom: 16 }} />}
            {success && <Alert type="success" title="Account created"             message={success} onClose={() => setSuccess('')} style={{ marginBottom: 16 }} />}

            <form onSubmit={handleSubmit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label className="label">Full name <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input className="field" value={form.name}
                    onChange={e => set('name', e.target.value)} placeholder="Assistant's full name" required />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label className="label">Email address <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input className="field" type="email" value={form.email}
                    onChange={e => set('email', e.target.value.toLowerCase())}
                    placeholder="assistant@library.com" required />
                </div>
                <div>
                  <label className="label">Password <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input className="field" type="password" value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 6 characters" required />
                </div>
                <div>
                  <label className="label">Confirm password <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input className="field" type="password" value={form.confirm_password}
                    onChange={e => set('confirm_password', e.target.value)}
                    placeholder="Repeat password" required />
                </div>
                <div>
                  <label className="label">Mobile</label>
                  <input className="field" value={form.mobile}
                    onChange={e => set('mobile', e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label className="label">Address <span style={{ color:'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="field" style={{ minHeight: 70, resize:'vertical' }}
                    value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Mailing address" />
                </div>
              </div>
            </form>
          </div>

          <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
            <button type="submit" onClick={handleSubmit} disabled={loading}
              className="btn btn-primary">
              {loading ? 'Creating account…' : 'Create assistant account'}
            </button>
          </div>
        </div>

        {/* Info sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>

          <div className="card" style={{ padding:'18px 20px' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Permissions</div>
            <div style={{ display:'grid', gap: 8 }}>
              {[
                { label: 'Issue & return books',     ok: true  },
                { label: 'Approve borrow requests',  ok: true  },
                { label: 'Manage members',           ok: true  },
                { label: 'Add & edit books',         ok: true  },
                { label: 'Delete books',             ok: false },
                { label: 'Delete members',           ok: false },
                { label: 'Create assistant accounts',ok: false },
                { label: 'System settings',          ok: false },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: item.ok ? 'var(--success-soft)' : 'var(--danger-soft)',
                    color:      item.ok ? 'var(--success)'      : 'var(--danger)',
                    border: `1px solid ${item.ok ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>{item.ok ? '✓' : '×'}</span>
                  <span style={{
                    fontSize: 13,
                    color: item.ok ? 'var(--text-2)' : 'var(--text-muted)',
                    textDecoration: item.ok ? 'none' : 'line-through',
                    textDecorationColor: 'var(--text-subtle)',
                  }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Alert type="info" title="Note"
            message="Library Assistants can run daily operations but cannot delete records or create new staff accounts. Only the Head Librarian can perform those actions." />
        </div>

      </div>
    </div>
  );
}
