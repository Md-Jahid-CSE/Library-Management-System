import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Member } from '../types';
import api from '../utils/api';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Members() {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian';
  const [members, setMembers]   = useState<Member[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]             = useState<Member | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [toast, setToast]             = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const s = new URLSearchParams(location.search).get('status');
    if (s) setStatusFilter(s);
  }, [location.search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/members', {
        params: { search, status: statusFilter, type: typeFilter, page, limit: 10 }
      });
      setMembers(data.data); setTotal(data.total);
    } finally { setLoading(false); }
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string, name: string) => {
    try {
      await api.put(`/members/${id}/status`, { status });
      setToast({
        message: status === 'active'   ? `${name} approved.`
                : status === 'suspended' ? `${name} suspended.`
                : `${name} status updated.`,
        type: 'success'
      });
      load();
    } catch { setToast({ message: 'Failed to update member.', type: 'error' }); }
  };

  const deleteMember = async (member: Member) => {
    try { await api.delete(`/members/${member.id}`); setToast({ message: `${member.name} deleted.`, type: 'success' }); load(); }
    catch { setToast({ message: 'Failed to delete member.', type: 'error' }); }
  };

  const counts = useMemo(() => ({
    pending:   members.filter(m => m.status === 'pending').length,
    active:    members.filter(m => m.status === 'active').length,
    suspended: members.filter(m => m.status === 'suspended').length,
  }), [members]);

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 1280, margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 22, gap: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>People</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Members</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {total.toLocaleString()} registered {total === 1 ? 'member' : 'members'}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="field" style={{ flex: '1 1 280px', minWidth: 240 }} value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, or member ID…" />
        <select className="field" style={{ width: 150 }} value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
        <div style={{ display:'flex', border:'1px solid var(--border2)', borderRadius: 8, overflow:'hidden' }}>
          {[
            { key: '',          label: 'All' },
            { key: 'pending',   label: `Pending${counts.pending  ? ` (${counts.pending})`  : ''}` },
            { key: 'active',    label: 'Active' },
            { key: 'suspended', label: 'Suspended' },
          ].map((f, i, arr) => (
            <button key={f.key || 'all'} onClick={() => { setStatusFilter(f.key); setPage(1); }}
              style={{
                padding:'7px 14px', fontSize: 12.5, fontWeight: 500,
                background: statusFilter === f.key ? 'var(--bg3)' : 'var(--bg2)',
                color:      statusFilter === f.key ? 'var(--text)' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderRight: i < arr.length - 1 ? '1px solid var(--border2)' : 'none',
              }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow:'hidden', marginBottom: 18 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Member</th>
              <th>ID</th>
              <th>Type</th>
              <th>Department</th>
              <th>Batch</th>
              <th>Mobile</th>
              <th>Status</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding: 60 }}>
                <div style={{ width: 22, height: 22, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
              </td></tr>
            ) : members.length ? members.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: m.account_type === 'student' ? '#dbeafe' : '#ede9fe',
                      color: m.account_type === 'student' ? '#1e40af' : '#5b21b6',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight: 600, fontSize: 13, flexShrink: 0
                    }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color:'var(--text)' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color:'var(--text-muted)' }}>{m.email.toLowerCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="mono" style={{ fontSize: 12, color:'var(--text-dim)' }}>{m.member_id}</td>
                <td>
                  <span className={m.account_type === 'student' ? 'badge badge-info' : 'badge badge-accent'}>
                    {m.account_type}
                  </span>
                </td>
                <td style={{ color:'var(--text-dim)' }}>{m.department || '—'}</td>
                <td style={{ color:'var(--text-dim)' }}>{m.batch || '—'}</td>
                <td className="mono" style={{ fontSize: 12.5, color:'var(--text-dim)' }}>{m.mobile || '—'}</td>
                <td>
                  <span className={
                    m.status === 'active'    ? 'badge badge-success' :
                    m.status === 'pending'   ? 'badge badge-warning' :
                    'badge badge-danger'
                  }>{m.status}</span>
                </td>
                <td style={{ textAlign:'right' }}>
                  <div style={{ display:'inline-flex', gap: 6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                    {m.status === 'pending'   && <button className="btn btn-accent btn-sm" onClick={() => updateStatus(m.id, 'active',    m.name)}>Approve</button>}
                    {m.status === 'active'    && <button className="btn btn-ghost  btn-sm" onClick={() => updateStatus(m.id, 'suspended', m.name)}>Suspend</button>}
                    {m.status === 'suspended' && <button className="btn btn-accent btn-sm" onClick={() => updateStatus(m.id, 'active',    m.name)}>Activate</button>}
                    <button className="btn btn-ghost  btn-sm" onClick={() => setModal(m)}>View</button>
                    {isLibrarian && <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(m)}>Delete</button>}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} style={{ textAlign:'center', padding: 60 }}>
                <div className="empty-title">No members found</div>
                <div className="empty-body" style={{ marginTop: 4 }}>Try adjusting your search or filters.</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize: 12.5, color:'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <div style={{ display:'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      )}

      {/* View modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: modal.account_type === 'student' ? '#dbeafe' : '#ede9fe',
                color: modal.account_type === 'student' ? '#1e40af' : '#5b21b6',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight: 600, fontSize: 16
              }}>{modal.name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color:'var(--text)' }}>{modal.name}</h2>
                <p style={{ fontSize: 12.5, color:'var(--text-muted)', marginTop: 1 }}>{modal.email.toLowerCase()}</p>
              </div>
              <span className={
                modal.status === 'active'  ? 'badge badge-success' :
                modal.status === 'pending' ? 'badge badge-warning' :
                'badge badge-danger'
              }>{modal.status}</span>
            </div>

            <div style={{ padding: 22, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
              {[
                ['Member ID',    modal.member_id, true],
                ['Account type', modal.account_type],
                ['Department',   modal.department || '—'],
                ['Batch',        modal.batch || '—'],
                ['Mobile',       modal.mobile || '—', true],
                ['Gender',       modal.gender || '—'],
              ].map(([label, value, mono]) => (
                <div key={label as string}>
                  <div className="eyebrow" style={{ fontSize: 10, marginBottom: 3 }}>{label}</div>
                  <div className={mono ? 'mono' : ''} style={{
                    fontSize: 13, color:'var(--text)', fontWeight: 500, textTransform: label === 'Account type' ? 'capitalize' : 'none'
                  }}>{value}</div>
                </div>
              ))}
              {modal.address && (
                <div style={{ gridColumn:'1 / -1' }}>
                  <div className="eyebrow" style={{ fontSize: 10, marginBottom: 3 }}>Address</div>
                  <div style={{ fontSize: 13, color:'var(--text)' }}>{modal.address}</div>
                </div>
              )}
            </div>

            <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap: 8, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Close</button>
              {modal.status === 'pending' && (
                <button className="btn btn-primary" onClick={() => { updateStatus(modal.id, 'active', modal.name); setModal(null); }}>
                  Approve member
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete member"
          message={`"${confirmDelete.name}" will be permanently removed along with all their records. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={() => { deleteMember(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
