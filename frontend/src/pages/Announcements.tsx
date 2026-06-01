import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import Toast from '../components/Toast';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';

const RECIPIENT_LABELS: Record<string, string> = {
  all:      'All members',
  students: 'All students',
  staff:    'All staff',
  specific: 'Specific member',
};

export default function Announcements() {
  const { user } = useAuth();
  const isStaff = user?.userType === 'user';
  return isStaff ? <StaffView /> : <MemberView />;
}

/* ─── Librarian / Assistant View ─── */
function StaffView() {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian';

  const [tab, setTab] = useState<'compose' | 'sent'>('compose');
  const [recipientType, setRecipientType] = useState('all');
  const [members, setMembers] = useState<any[]>([]);
  const [memberId, setMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<any[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [toast, setToast] = useState<any>(null);

  const loadMembers = useCallback(async () => {
    try {
      const { data } = await api.get('/members?limit=500&status=active');
      setMembers(data.data || []);
    } catch { setMembers([]); }
  }, []);

  const loadSent = useCallback(async () => {
    setLoadingSent(true);
    try {
      const { data } = await api.get('/announcements/sent');
      setSent(data.data || []);
    } catch { setSent([]); }
    finally { setLoadingSent(false); }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { if (tab === 'sent') loadSent(); }, [tab, loadSent]);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.member_id?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedMember = members.find(m => String(m.id) === String(memberId));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    if (recipientType === 'specific' && !memberId) {
      setToast({ type: 'error', message: 'Please select a member to send to.' });
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/announcements/send', {
        recipient_type: recipientType,
        member_id: recipientType === 'specific' ? memberId : undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      setToast({ type: 'success', message: data.message || 'Announcement sent.' });
      setSubject(''); setMessage(''); setMemberId(''); setMemberSearch('');
    } catch (err: any) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to send announcement.' });
    } finally { setSending(false); }
  };

  const deleteAnnouncement = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/announcements/${confirmDelete.id}`);
      setSent(prev => prev.filter(a => a.id !== confirmDelete.id));
      setToast({ type: 'success', message: 'Announcement deleted.' });
    } catch {
      setToast({ type: 'error', message: 'Failed to delete announcement.' });
    } finally { setConfirmDelete(null); }
  };

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 1100, margin:'0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 22 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Communication</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color:'var(--text)', letterSpacing:'-0.4px' }}>Announcements</h1>
        <p style={{ fontSize: 13, color:'var(--text-muted)', marginTop: 4 }}>
          Send announcements to members. Recipients receive an email and an in-app notification.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 4, marginBottom: 18, borderBottom:'1px solid var(--border)' }}>
        {([
          { key:'compose', label:'Compose' },
          { key:'sent',    label:'Sent history' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding:'10px 14px',
              background:'transparent', border:'none',
              borderBottom: tab === t.key ? '2px solid var(--text)' : '2px solid transparent',
              color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: tab === t.key ? 600 : 500, fontSize: 13.5,
              fontFamily:'inherit', cursor:'pointer', marginBottom: -1,
            }}>{t.label}</button>
        ))}
      </div>

      {tab === 'compose' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap: 18, alignItems:'start' }}>

          <div className="card">
            <form onSubmit={handleSend}>
              <div style={{ padding: 22 }}>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Send to</label>
                  <select className="field" value={recipientType}
                    onChange={e => { setRecipientType(e.target.value); setMemberId(''); setMemberSearch(''); }}>
                    <option value="all">All active members</option>
                    <option value="students">All students</option>
                    <option value="staff">All staff members</option>
                    <option value="specific">Specific member</option>
                  </select>
                </div>

                {recipientType === 'specific' && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">Search member</label>
                    <input className="field" placeholder="Search by name, email, or ID…"
                      value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setMemberId(''); }} />
                    {memberSearch && !selectedMember && (
                      <div style={{
                        marginTop: 6, border:'1px solid var(--border2)', borderRadius: 8,
                        maxHeight: 220, overflowY:'auto', background:'var(--bg2)'
                      }}>
                        {filteredMembers.length === 0 ? (
                          <div style={{ padding:'14px', fontSize: 13, color:'var(--text-muted)', textAlign:'center' }}>
                            No matching members.
                          </div>
                        ) : filteredMembers.slice(0, 12).map(m => (
                          <button key={m.id} type="button"
                            onClick={() => { setMemberId(m.id); setMemberSearch(''); }}
                            style={{
                              display:'block', width:'100%', textAlign:'left',
                              padding:'9px 12px', border:'none',
                              borderBottom:'1px solid var(--border)',
                              background:'transparent', cursor:'pointer', fontFamily:'inherit'
                            }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color:'var(--text)' }}>{m.name}</div>
                            <div style={{ fontSize: 11.5, color:'var(--text-muted)', marginTop: 1 }}>
                              <span className="mono">{m.member_id}</span> · <span style={{ textTransform:'capitalize' }}>{m.account_type}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedMember && (
                      <div style={{
                        marginTop: 8, padding:'8px 12px', background:'var(--accent-soft)',
                        border:'1px solid var(--accent-soft-2)', borderRadius: 8,
                        display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color:'var(--accent-text)' }}>{selectedMember.name}</div>
                          <div style={{ fontSize: 11.5, color:'var(--accent-text)', opacity: 0.8 }}>
                            <span className="mono">{selectedMember.member_id}</span> · {selectedMember.email.toLowerCase()}
                          </div>
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm"
                          onClick={() => { setMemberId(''); setMemberSearch(''); }}>
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Subject</label>
                  <input className="field" required value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Library maintenance notice" />
                </div>

                <div>
                  <label className="label">Message</label>
                  <textarea className="field" required style={{ minHeight: 160, resize:'vertical', lineHeight: 1.6 }}
                    value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Write your announcement here…" />
                  <div style={{ fontSize: 11.5, color:'var(--text-muted)', marginTop: 6 }}>
                    {message.length} characters
                  </div>
                </div>
              </div>

              <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize: 12.5, color:'var(--text-muted)' }}>
                  Will be sent to{' '}
                  <strong style={{ color:'var(--text-2)' }}>
                    {recipientType === 'specific' && selectedMember
                      ? selectedMember.name
                      : RECIPIENT_LABELS[recipientType]}
                  </strong>
                </span>
                <button type="submit" disabled={sending} className="btn btn-primary">
                  {sending ? 'Sending…' : 'Send announcement'}
                </button>
              </div>
            </form>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
            <div className="card" style={{ padding:'16px 18px' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Delivery</div>
              <ul style={{ fontSize: 13, color:'var(--text-2)', lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
                <li>Email is sent to each recipient's registered address.</li>
                <li>An in-app notification appears in their inbox.</li>
                <li>Only active members receive the announcement.</li>
              </ul>
            </div>
            <Alert type="info" title="Tip"
              message="Keep messages concise. Members can read the full text on their notifications page." />
          </div>
        </div>
      )}

      {tab === 'sent' && (
        <div>
          {loadingSent ? (
            <div style={{ display:'flex', justifyContent:'center', padding: 60 }}>
              <div style={{ width: 22, height: 22, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
            </div>
          ) : sent.length === 0 ? (
            <div className="card empty">
              <div className="empty-title">No announcements sent yet</div>
              <div className="empty-body">Once you send an announcement, it will appear here.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
              {sent.map(a => (
                <div key={a.id} className="card" style={{ padding:'16px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 16, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 14.5, fontWeight: 600, color:'var(--text)' }}>{a.subject}</h3>
                    <div style={{ display:'flex', alignItems:'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 11.5, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                        {new Date(a.sent_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </span>
                      {isLibrarian && (
                        <button className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDelete(a)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{
                    fontSize: 13, color:'var(--text-dim)', lineHeight: 1.6, whiteSpace:'pre-wrap',
                    marginBottom: 10
                  }}>
                    {a.message.length > 240 ? a.message.slice(0, 240) + '…' : a.message}
                  </p>
                  <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
                    <span className="badge badge-accent">
                      {RECIPIENT_LABELS[a.recipient_type]}
                      {a.recipient_type === 'specific' && a.member_name ? `: ${a.member_name}` : ''}
                    </span>
                    <span className="badge badge-neutral">{a.sent_count} recipient{a.sent_count === 1 ? '' : 's'}</span>
                    <span style={{ fontSize: 11.5, color:'var(--text-muted)' }}>Sent by {a.sent_by_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete announcement"
          message={`"${confirmDelete.subject}" will be permanently deleted from the sent history. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={deleteAnnouncement}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

/* ─── Member View ─── */
function MemberView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'unread'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/announcements/my');
      setItems(data.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (inboxId: number) => {
    try {
      await api.put(`/announcements/${inboxId}/read`);
      setItems(prev => prev.map(i => i.inbox_id === inboxId ? { ...i, is_read: 1 } : i));
    } catch {}
  };

  const markAllRead = async () => {
    const unreadItems = items.filter(i => !i.is_read);
    setItems(prev => prev.map(i => ({ ...i, is_read: 1 })));
    await Promise.all(unreadItems.map(i => api.put(`/announcements/${i.inbox_id}/read`).catch(() => {})));
  };

  const unread  = items.filter(i => !i.is_read).length;
  const visible = filter === 'unread' ? items.filter(i => !i.is_read) : items;

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 880, margin:'0 auto' }}>

      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 22, gap: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Inbox</p>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color:'var(--text)', letterSpacing:'-0.4px' }}>
              Notifications
            </h1>
            {unread > 0 && <span className="badge badge-danger">{unread} new</span>}
          </div>
          <p style={{ fontSize: 13, color:'var(--text-muted)', marginTop: 4 }}>
            Messages and announcements from the library administration.
          </p>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      <div style={{ display:'flex', gap: 4, marginBottom: 14, borderBottom:'1px solid var(--border)' }}>
        {([
          { key:'all',    label: `All (${items.length})` },
          { key:'unread', label: `Unread (${unread})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{
              padding:'10px 14px', background:'transparent', border:'none',
              borderBottom: filter === t.key ? '2px solid var(--text)' : '2px solid transparent',
              color: filter === t.key ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: filter === t.key ? 600 : 500, fontSize: 13.5,
              fontFamily:'inherit', cursor:'pointer', marginBottom: -1,
            }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding: 60 }}>
          <div style={{ width: 22, height: 22, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        </div>
      ) : visible.length === 0 ? (
        <div className="card empty">
          <div className="empty-title">{filter === 'unread' ? 'You\'re all caught up' : 'No notifications yet'}</div>
          <div className="empty-body">
            {filter === 'unread' ? 'No unread announcements at the moment.' : 'Announcements from the library will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          {visible.map(item => (
            <div key={item.inbox_id}
              onClick={() => !item.is_read && markRead(item.inbox_id)}
              style={{
                background: 'var(--bg2)',
                border: `1px solid ${!item.is_read ? 'var(--accent-soft-2)' : 'var(--border)'}`,
                borderLeft: !item.is_read ? '3px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 10,
                padding:'14px 18px',
                cursor: !item.is_read ? 'pointer' : 'default',
                boxShadow: !item.is_read ? 'var(--shadow-sm)' : 'none',
                transition:'border-color .15s, box-shadow .15s'
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 16, marginBottom: 6 }}>
                <h3 style={{
                  fontSize: 14.5, fontWeight: !item.is_read ? 600 : 500, color:'var(--text)'
                }}>{item.subject}</h3>
                <div style={{ fontSize: 11.5, color:'var(--text-muted)', whiteSpace:'nowrap', flexShrink: 0 }}>
                  {new Date(item.sent_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                </div>
              </div>
              <p style={{ fontSize: 13, color:'var(--text-dim)', lineHeight: 1.6, whiteSpace:'pre-wrap', marginBottom: 8 }}>
                {item.message}
              </p>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: 12 }}>
                <span style={{ color:'var(--text-muted)' }}>
                  From <strong style={{ color:'var(--text-2)' }}>{item.sent_by_name}</strong>
                </span>
                {!item.is_read
                  ? <span style={{ color:'var(--accent)', fontWeight: 500 }}>Click to mark as read</span>
                  : <span style={{ color:'var(--text-subtle)' }}>Read</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
