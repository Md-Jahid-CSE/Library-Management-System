import React, { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import api from '../utils/api';

export default function BorrowRequests() {
  const [requests, setRequests]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<'pending'|'approved'|'rejected'>('pending');
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState<any>(null);
  const [approveModal, setApproveModal] = useState<any>(null);
  const [rejectModal, setRejectModal]   = useState<any>(null);
  const [dueDate, setDueDate]     = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const load = (status = filter) => {
    setLoading(true);
    api.get('/borrows/requests', { params: { status } })
      .then(r => { setRequests(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(filter); /* eslint-disable-next-line */ }, [filter]);

  const openApprove = (req: any) => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    setDueDate(d.toISOString().split('T')[0]);
    setApproveModal(req);
  };

  const approve = async () => {
    try {
      await api.put(`/borrows/requests/${approveModal.id}/approve`, { due_date: dueDate });
      setToast({ message: 'Request approved. Book has been issued.', type: 'success' });
      setApproveModal(null); load();
    } catch (e: any) { setToast({ message: e.response?.data?.message || 'Failed to approve.', type: 'error' }); }
  };

  const reject = async () => {
    try {
      await api.put(`/borrows/requests/${rejectModal.id}/reject`, { reject_reason: rejectReason });
      setToast({ message: 'Request rejected.', type: 'info' });
      setRejectModal(null); setRejectReason(''); load();
    } catch { setToast({ message: 'Failed to reject request.', type: 'error' }); }
  };

  const visible = requests.filter(r => !search ||
    `${r.title} ${r.author} ${r.member_name} ${r.member_code}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 1280, margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 22, gap: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Circulation</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color:'var(--text)', letterSpacing:'-0.4px' }}>Borrow requests</h1>
          <p style={{ fontSize: 13, color:'var(--text-muted)', marginTop: 4 }}>
            Review pending requests and issue books to members.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: 12, marginBottom: 16, display:'flex', gap: 10, alignItems:'center', flexWrap:'wrap' }}>
        <input className="field" style={{ flex:'1 1 280px', minWidth: 240 }} value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by book title, author, or member…" />
        <div style={{ display:'flex', border:'1px solid var(--border2)', borderRadius: 8, overflow:'hidden' }}>
          {(['pending','approved','rejected'] as const).map((f, i, arr) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding:'7px 14px', fontSize: 12.5, fontWeight: 500,
                background: filter === f ? 'var(--bg3)' : 'var(--bg2)',
                color: filter === f ? 'var(--text)' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize',
                borderRight: i < arr.length - 1 ? '1px solid var(--border2)' : 'none',
              }}>{f}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding: 80 }}>
          <div style={{ width: 24, height: 24, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        </div>
      ) : visible.length ? (
        <div style={{ display:'grid', gap: 12 }}>
          {visible.map(req => (
            <div key={req.id} className="card" style={{ padding: 18 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1.5fr 2fr auto', gap: 18, alignItems:'flex-start' }}>

                {/* Book */}
                <div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Book</div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color:'var(--text)' }}>{req.title}</div>
                  <div style={{ fontSize: 12.5, color:'var(--text-muted)', marginTop: 2 }}>{req.author}</div>
                  <div style={{ marginTop: 10 }}>
                    <span className={req.available_copies > 0 ? 'badge badge-success' : 'badge badge-danger'}>
                      {req.available_copies} available
                    </span>
                  </div>
                </div>

                {/* Member */}
                <div style={{
                  background:'var(--bg3)', border:'1px solid var(--border)', borderRadius: 8,
                  padding:'12px 14px'
                }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Member</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
                    <Pair label="Name"       value={req.member_name} />
                    <Pair label="ID"         value={req.member_code} mono />
                    <Pair label="Type"       value={req.account_type} cap />
                    <Pair label="Department" value={req.department || '—'} />
                    <Pair label="Batch"      value={req.batch || '—'} />
                    <Pair label="Mobile"     value={req.mobile || '—'} mono />
                  </div>
                </div>

                {/* Status + actions */}
                <div style={{ minWidth: 160, textAlign:'right' }}>
                  <span className={
                    req.status === 'approved' ? 'badge badge-success' :
                    req.status === 'rejected' ? 'badge badge-danger' :
                    'badge badge-warning'
                  }>{req.status}</span>
                  <div style={{ fontSize: 11.5, color:'var(--text-muted)', marginTop: 8 }}>
                    Requested {new Date(req.request_date).toLocaleDateString('en-GB')}
                  </div>
                  {req.reviewed_by_name && (
                    <div style={{ fontSize: 11.5, color:'var(--text-muted)', marginTop: 2 }}>
                      Reviewed by {req.reviewed_by_name}
                    </div>
                  )}
                  {req.reject_reason && (
                    <div style={{
                      fontSize: 12, color:'var(--danger)', marginTop: 8,
                      background:'var(--danger-soft)', border:'1px solid rgba(220,38,38,0.2)',
                      padding:'6px 10px', borderRadius: 6, textAlign:'left',
                      maxWidth: 220, marginLeft:'auto'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 11 }}>Reason</div>
                      {req.reject_reason}
                    </div>
                  )}
                  {req.status === 'pending' && (
                    <div style={{ display:'flex', gap: 6, marginTop: 12, justifyContent:'flex-end' }}>
                      <button className="btn btn-accent btn-sm" onClick={() => openApprove(req)}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setRejectModal(req); setRejectReason(''); }}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <div className="empty-title">No {filter} requests</div>
          <div className="empty-body">
            {search ? 'Try clearing your search.' : `${filter[0].toUpperCase()}${filter.slice(1)} requests will appear here.`}
          </div>
        </div>
      )}

      {/* Approve modal */}
      {approveModal && (
        <Modal title="Approve request"
          subtitle={<>Issuing <strong>{approveModal.title}</strong> to <strong>{approveModal.member_name}</strong>.</>}
          onClose={() => setApproveModal(null)}
          footer={<>
            <button className="btn btn-ghost"   onClick={() => setApproveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={approve}>Approve and issue</button>
          </>}>
          <div>
            <label className="label">Due date</label>
            <input className="field" type="date" value={dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDueDate(e.target.value)} />
            <div style={{ display:'flex', gap: 6, marginTop: 8 }}>
              {[7, 14, 30].map(days => (
                <button key={days} type="button" className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + days);
                    setDueDate(d.toISOString().split('T')[0]);
                  }}>+{days} days</button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <Modal title="Reject request"
          subtitle={<>Rejecting <strong>{rejectModal.title}</strong> from <strong>{rejectModal.member_name}</strong>.</>}
          onClose={() => setRejectModal(null)}
          footer={<>
            <button className="btn btn-ghost"  onClick={() => setRejectModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={reject}>Reject request</button>
          </>}>
          <div>
            <label className="label">Reason <span style={{ color:'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea className="field" style={{ minHeight: 90, resize:'vertical' }}
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Book is reserved for another member." />
            <div style={{ fontSize: 12, color:'var(--text-muted)', marginTop: 6 }}>
              The reason will be shown to the member.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Pair({ label, value, mono, cap }: { label: string; value: any; mono?: boolean; cap?: boolean }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{
        fontSize: 12.5, fontWeight: 500, color:'var(--text)',
        textTransform: cap ? 'capitalize' : 'none'
      }}>{value}</div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, footer, children }: {
  title: string; subtitle?: React.ReactNode; onClose: () => void;
  footer: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color:'var(--text)' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12.5, color:'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>}
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap: 8, justifyContent:'flex-end' }}>
          {footer}
        </div>
      </div>
    </div>
  );
}
