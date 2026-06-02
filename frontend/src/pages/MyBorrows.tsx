import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import Alert from '../components/Alert';

const statusBadgeClass = (s: string) => {
  switch (s) {
    case 'returned':
    case 'approved':
      return 'badge badge-success';
    case 'overdue':
    case 'rejected':
      return 'badge badge-danger';
    case 'pending':
    case 'borrowed':
      return 'badge badge-warning';
    default:
      return 'badge badge-neutral';
  }
};

export default function MyBorrows() {
  const [borrows, setBorrows]   = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [deleted, setDeleted]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [delLoading, setDelLoading] = useState(false);
  const [tab, setTab] = useState<'requests'|'borrows'|'deleted'>('requests');
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/borrows/my'), api.get('/borrows/my-requests')])
      .then(([b, r]) => {
        setBorrows(b.data.data || []);
        setRequests(r.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadDeleted = useCallback(async () => {
    setDelLoading(true);
    try {
      const { data } = await api.get('/borrows/my-deleted');
      setDeleted(data.data || []);
    } catch { setDeleted([]); }
    finally { setDelLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isBusy = (key: string) => busy.has(key);
  const setBusyKey = (key: string, val: boolean) => setBusy(prev => {
    const next = new Set(prev); val ? next.add(key) : next.delete(key); return next;
  });

  const hideRequest = async (id: number) => {
    const key = `req-${id}`; if (isBusy(key)) return;
    setBusyKey(key, true);
    setRequests(p => p.filter(x => x.id !== id));
    try { await api.delete(`/borrows/my-requests/${id}`); if (tab === 'deleted') loadDeleted(); }
    catch { load(); }
    finally { setBusyKey(key, false); }
  };

  const hideBorrow = async (id: number) => {
    const key = `borrow-${id}`; if (isBusy(key)) return;
    setBusyKey(key, true);
    setBorrows(p => p.filter(x => x.id !== id));
    try { await api.delete(`/borrows/my-borrows/${id}`); if (tab === 'deleted') loadDeleted(); }
    catch { load(); }
    finally { setBusyKey(key, false); }
  };

  const restore = async (id: number, item_type: string) => {
    const key = `restore-${item_type}-${id}`; if (isBusy(key)) return;
    setBusyKey(key, true);
    setDeleted(p => p.filter(x => !(x.id === id && x.item_type === item_type)));
    try { await api.put(`/borrows/my-deleted/${id}/restore`, { item_type }); load(); }
    catch { loadDeleted(); }
    finally { setBusyKey(key, false); }
  };

  const deleteFromTrash = async (id: number, item_type: string) => {
    const key = `trash-${item_type}-${id}`; if (isBusy(key)) return;
    setBusyKey(key, true);
    setDeleted(p => p.filter(x => !(x.id === id && x.item_type === item_type)));
    try { await api.delete(`/borrows/my-deleted/${id}`, { data: { item_type } }); }
    catch { loadDeleted(); }
    finally { setBusyKey(key, false); }
  };

  const pendingCount  = requests.filter(r => r.status === 'pending').length;
  const overdueCount  = borrows.filter(b => b.status === 'overdue').length;
  const activeBorrows = borrows.filter(b => b.status === 'borrowed' || b.status === 'overdue').length;

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 20, gap: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Account</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color:'var(--text)', letterSpacing:'-0.4px' }}>My library</h1>
          <p style={{ fontSize: 13, color:'var(--text-muted)', marginTop: 4 }}>
            Track your requests, currently borrowed books, and history.
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <MiniStat label="Active borrows"   value={activeBorrows} />
        <MiniStat label="Pending requests" value={pendingCount} />
        <MiniStat label="Overdue"          value={overdueCount} tone={overdueCount > 0 ? 'danger' : undefined} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 4, marginBottom: 16, borderBottom:'1px solid var(--border)' }}>
        {([
          { key:'requests', label:'Requests',         count: pendingCount },
          { key:'borrows',  label:'Borrowed books',   count: activeBorrows },
          { key:'deleted',  label:'Recently deleted', count: 0 },
        ] as const).map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'deleted') loadDeleted(); }}
            style={{
              padding:'10px 14px',
              background:'transparent', border:'none',
              borderBottom: tab === t.key ? '2px solid var(--text)' : '2px solid transparent',
              color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: tab === t.key ? 600 : 500, fontSize: 13.5,
              fontFamily:'inherit', cursor:'pointer',
              marginBottom: -1,
              display:'flex', alignItems:'center', gap: 8,
            }}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                background: tab === t.key ? 'var(--text)' : 'var(--bg3)',
                color: tab === t.key ? '#fff' : 'var(--text-muted)',
                fontSize: 10.5, fontWeight: 600,
                padding:'1px 7px', borderRadius: 99, lineHeight: 1.5,
                border: tab === t.key ? 'none' : '1px solid var(--border)',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      {loading && tab !== 'deleted' ? (
        <div style={{ display:'flex', justifyContent:'center', padding: 80 }}>
          <div style={{ width: 24, height: 24, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        </div>

      ) : tab === 'requests' ? (
        requests.length ? (
          <div style={{ display:'grid', gap: 10 }}>
            {requests.map(r => {
              const canDel = r.status === 'rejected' || r.status === 'approved';
              return (
                <ItemRow key={r.id}
                  title={r.title}
                  subtitle={r.author}
                  meta={`Requested on ${new Date(r.request_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}`}
                  badge={<span className={statusBadgeClass(r.status)}>{r.status}</span>}
                  rejectReason={r.reject_reason}
                  onDelete={canDel ? () => hideRequest(r.id) : undefined}
                  deleting={isBusy(`req-${r.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <Empty title="No requests yet" body="Browse the catalogue and click “Request to borrow” on any available book." />
        )

      ) : tab === 'borrows' ? (
        borrows.length ? (
          <div style={{ display:'grid', gap: 10 }}>
            {borrows.map(b => (
              <ItemRow key={b.id}
                title={b.title}
                subtitle={b.author}
                meta={`Due ${b.due_date?.split('T')[0]}`}
                emphasizeMeta={b.status === 'overdue'}
                badge={<span className={statusBadgeClass(b.status)}>{b.status}</span>}
                fineAmount={b.fine_amount}
                onDelete={b.status === 'returned' ? () => hideBorrow(b.id) : undefined}
                deleting={isBusy(`borrow-${b.id}`)}
              />
            ))}
          </div>
        ) : (
          <Empty title="No borrowed books" body="Books you currently have on loan will appear here." />
        )

      ) : (
        <div>
          <Alert type="info" title="Items are kept for 30 days"
            message="After 30 days, deleted items are permanently removed. You can restore them anytime before then."
            style={{ marginBottom: 14 }} />

          {delLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding: 60 }}>
              <div style={{ width: 22, height: 22, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
            </div>
          ) : deleted.length ? (
            <div style={{ display:'grid', gap: 10 }}>
              {deleted.map(item => {
                const rKey = `restore-${item.item_type}-${item.id}`;
                const dKey = `trash-${item.item_type}-${item.id}`;
                return (
                  <div key={`${item.item_type}-${item.id}`}
                    className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap: 14, opacity: 0.92 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12.5, color:'var(--text-muted)', marginTop: 1 }}>{item.author}</div>
                      <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 6, flexWrap:'wrap' }}>
                        <span className={statusBadgeClass(item.status)}>{item.status}</span>
                        <span style={{ fontSize: 11.5, color:'var(--text-muted)' }}>{item.item_type === 'borrow' ? 'Borrow' : 'Request'}</span>
                        {item.deleted_at && (
                          <span style={{ fontSize: 11.5, color:'var(--text-muted)' }}>
                            · Deleted {new Date(item.deleted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm"  onClick={() => restore(item.id, item.item_type)}     disabled={isBusy(rKey)}>Restore</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteFromTrash(item.id, item.item_type)} disabled={isBusy(dKey)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty title="Recently Deleted is empty" body="Items you remove from your library will appear here for 30 days." />
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <div className="card" style={{ padding:'14px 16px' }}>
      <div style={{ fontSize: 12, color:'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 700, marginTop: 4,
        color: tone === 'danger' ? 'var(--danger)' : 'var(--text)',
        letterSpacing: '-0.4px'
      }}>{value}</div>
    </div>
  );
}

function ItemRow({ title, subtitle, meta, emphasizeMeta, badge, fineAmount, rejectReason, onDelete, deleting }: {
  title: string; subtitle?: string; meta?: string; emphasizeMeta?: boolean;
  badge: React.ReactNode; fineAmount?: number; rejectReason?: string;
  onDelete?: () => void; deleting?: boolean;
}) {
  return (
    <div className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: 12.5, color:'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
        {meta && (
          <div style={{
            fontSize: 12, color: emphasizeMeta ? 'var(--danger)' : 'var(--text-muted)',
            fontWeight: emphasizeMeta ? 600 : 400, marginTop: 5
          }}>{meta}</div>
        )}
        {rejectReason && (
          <div style={{
            fontSize: 12, color:'var(--danger)', marginTop: 8,
            background:'var(--danger-soft)', border:'1px solid rgba(220,38,38,0.18)',
            padding:'6px 10px', borderRadius: 6, maxWidth: 360
          }}>
            <span style={{ fontWeight: 600 }}>Reason:</span> {rejectReason}
          </div>
        )}
      </div>
      <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap: 12, flexShrink: 0 }}>
        <div>
          {badge}
          {!!fineAmount && fineAmount > 0 && (
            <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, color:'var(--danger)', marginTop: 4 }}>
              Fine ৳{Number(fineAmount).toFixed(2)}
            </div>
          )}
        </div>
        {onDelete && (
          <button className="btn btn-ghost btn-sm" onClick={onDelete} disabled={deleting}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card empty">
      <div className="empty-title">{title}</div>
      <div className="empty-body">{body}</div>
    </div>
  );
}
