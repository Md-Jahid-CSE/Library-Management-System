import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Borrow, Book, Member } from '../types';
import api from '../utils/api';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';

type StatusFilter = '' | 'borrowed' | 'returned' | 'overdue';

/* ── Reusable combobox / autocomplete ── */
function Combobox({ label, required, placeholder, value, display, onSelect, items, renderItem, renderSelected, loading: loadingItems }: {
  label: string; required?: boolean; placeholder: string;
  value: string; display: string;
  onSelect: (id: string) => void;
  items: any[];
  renderItem: (item: any, active: boolean) => React.ReactNode;
  renderSelected?: (item: any) => React.ReactNode;
  loading?: boolean;
}) {
  const [q, setQ]           = useState('');
  const [open, setOpen]     = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef            = useRef<HTMLInputElement>(null);
  const dropRef             = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false); setFocused(false);
        if (!value) setQ('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const filtered = useMemo(() => {
    if (!q.trim()) return [];          // nothing until user types
    const lq = q.toLowerCase();
    return items.filter(item => {
      const text = (item.title || item.name || '') + ' ' + (item.author || item.member_id || '') + ' ' + (item.isbn || item.email || '');
      return text.toLowerCase().includes(lq);
    }).slice(0, 30);                   // max 30 results, scrollable
  }, [items, q]);

  const selectedItem = value ? items.find(i => String(i.id) === value) : null;

  const handleFocus = () => {
    setFocused(true); setOpen(true);
    if (value) setQ('');   // clear to allow re-search
  };

  const handleSelect = (item: any) => {
    onSelect(String(item.id));
    setQ('');
    setOpen(false);
    setFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(''); setQ(''); setOpen(false); setFocused(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <label className="label">
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="field"
          value={focused ? q : (selectedItem ? (selectedItem.title || selectedItem.name) : '')}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={handleFocus}
          placeholder={focused ? placeholder : (selectedItem ? '' : placeholder)}
          autoComplete="off"
          style={{ paddingRight: selectedItem ? 32 : 12 }}
        />
        {selectedItem && !focused && (
          <button type="button" onClick={handleClear}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>×</button>
        )}
      </div>

      {/* Selected chip */}
      {selectedItem && !focused && renderSelected && (
        <div style={{ marginTop: 6 }}>{renderSelected(selectedItem)}</div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 8, boxShadow: 'var(--shadow-md)',
          zIndex: 50, maxHeight: 220, overflowY: 'auto',
        }}>
          {loadingItems ? (
            <div style={{ padding: '14px 12px', textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Loading…
            </div>
          ) : !q.trim() ? (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Start typing to search…
            </div>
          ) : filtered.length ? filtered.map(item => (
            <button key={item.id} type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect(item); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 12px', border: 'none',
                borderBottom: '1px solid var(--border)',
                background: String(item.id) === value ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {renderItem(item, String(item.id) === value)}
            </button>
          )) : (
            <div style={{ padding: '14px 12px', textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
              No results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Borrows() {
  const [borrows, setBorrows]   = useState<Borrow[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [sf, setSf]             = useState<StatusFilter>('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  const [modal, setModal]       = useState(false);
  const [books, setBooks]       = useState<Book[]>([]);
  const [members, setMembers]   = useState<Member[]>([]);
  const [form, setForm]         = useState({ book_id:'', member_id:'', due_date:'', notes:'' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [msg, setMsg]           = useState<{ text: string; tone: 'success'|'info' } | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<{ id: number; title: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/borrows', { params: { status: sf, page, limit: 10 } });
      setBorrows(data.data); setTotal(data.total);
    } finally { setLoading(false); }
  }, [sf, page]);

  useEffect(() => { load(); }, [load]);

  const openIssue = async () => {
    setError('');
    setForm({ book_id: '', member_id: '', due_date: '', notes: '' });
    const [b, m] = await Promise.all([
      api.get('/books',   { params: { limit: 500 } }),
      api.get('/members', { params: { limit: 500 } })
    ]);
    setBooks(b.data.data.filter((bk: Book) => bk.available_copies > 0));
    setMembers(m.data.data.filter((mb: Member) => mb.status === 'active'));
    const d = new Date(); d.setDate(d.getDate() + 14);
    setForm(f => ({ ...f, due_date: d.toISOString().split('T')[0] }));
    setModal(true);
  };

  const closeModal = () => { setModal(false); setError(''); };

  const saveBorrow = async () => {
    if (!form.book_id || !form.member_id || !form.due_date) { setError('Please select a book, member, and due date.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/borrows', {
        book_id: Number(form.book_id),
        member_id: Number(form.member_id),
        due_date: form.due_date,
        notes: form.notes || undefined,
      });
      closeModal();
      setMsg({ text: 'Book issued successfully.', tone: 'success' });
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to issue book.'); }
    finally { setSaving(false); }
  };

  const returnBook = async (id: number) => {
    const { data } = await api.put(`/borrows/${id}/return`);
    setMsg({
      text: data.fine > 0 ? `Returned. Fine collected: ৳${data.fine}.` : 'Book returned successfully.',
      tone: data.fine > 0 ? 'info' : 'success'
    });
    setTimeout(() => setMsg(null), 4500);
    load();
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: '',         label: 'All'      },
    { key: 'borrowed', label: 'Borrowed' },
    { key: 'overdue',  label: 'Overdue'  },
    { key: 'returned', label: 'Returned' },
  ];

  const tableSearch = search.toLowerCase();
  const visibleBorrows = borrows.filter(b =>
    !search ||
    b.title?.toLowerCase().includes(tableSearch) ||
    b.member_name?.toLowerCase().includes(tableSearch) ||
    b.member_code?.toLowerCase().includes(tableSearch)
  );

  const totalPages = Math.ceil(total / 10) || 1;
  const selectedBook   = books.find(b => String(b.id) === form.book_id);
  const selectedMember = members.find(m => String(m.id) === form.member_id);

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 1280, margin:'0 auto' }}>

      {/* ─── Header ─── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 22, gap: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Circulation</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Borrows</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {total.toLocaleString()} borrow {total === 1 ? 'record' : 'records'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openIssue}>Issue book</button>
      </div>

      {msg && (
        <Alert type={msg.tone} message={msg.text} onClose={() => setMsg(null)} style={{ marginBottom: 14 }} />
      )}

      {/* ─── Filter bar ─── */}
      <div className="card" style={{ padding: 12, marginBottom: 16, display:'flex', gap: 10, alignItems:'center', flexWrap:'wrap' }}>
        <input className="field" style={{ flex:'1 1 280px', minWidth: 240 }}
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by book, member name, or ID…" />
        <div style={{ display:'flex', border:'1px solid var(--border2)', borderRadius: 8, overflow:'hidden' }}>
          {filters.map((f, i) => (
            <button key={f.key} onClick={() => { setSf(f.key); setPage(1); }}
              style={{
                padding:'7px 14px', fontSize: 12.5, fontWeight: 500,
                background: sf === f.key ? 'var(--bg3)' : 'var(--bg2)',
                color:      sf === f.key ? 'var(--text)' : 'var(--text-muted)',
                borderRight: i < filters.length - 1 ? '1px solid var(--border2)' : 'none',
                border: 'none', cursor: 'pointer', fontFamily:'inherit'
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="card" style={{ overflow:'hidden', marginBottom: 18 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Book</th>
              <th>Member</th>
              <th>Borrowed</th>
              <th>Due</th>
              <th>Status</th>
              <th>Fine</th>
              <th style={{ textAlign:'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding: 60 }}>
                <div style={{ width: 22, height: 22, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
              </td></tr>
            ) : visibleBorrows.length ? visibleBorrows.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color:'var(--text)' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color:'var(--text-muted)', marginTop: 1 }}>{b.author}</div>
                </td>
                <td>
                  <div style={{ fontSize: 13, color:'var(--text)' }}>{b.member_name}</div>
                  <div className="mono" style={{ fontSize: 11.5, color:'var(--text-muted)', marginTop: 1 }}>{b.member_code}</div>
                </td>
                <td className="mono" style={{ fontSize: 12.5, color:'var(--text-dim)' }}>
                  {b.borrow_date?.split('T')[0]}
                </td>
                <td className="mono" style={{
                  fontSize: 12.5,
                  color: b.status === 'overdue' ? 'var(--danger)' : 'var(--text-dim)',
                  fontWeight: b.status === 'overdue' ? 600 : 400
                }}>
                  {b.due_date?.split('T')[0]}
                </td>
                <td>
                  <span className={
                    b.status === 'returned' ? 'badge badge-success' :
                    b.status === 'overdue'  ? 'badge badge-danger'  :
                    b.status === 'lost'     ? 'badge badge-warning' :
                    'badge badge-accent'
                  }>{b.status}</span>
                </td>
                <td className="mono" style={{
                  fontSize: 12.5,
                  color: b.fine_amount > 0 ? 'var(--danger)' : 'var(--text-subtle)',
                  fontWeight: b.fine_amount > 0 ? 600 : 400
                }}>
                  {b.fine_amount > 0 ? `৳${Number(b.fine_amount).toFixed(2)}` : '—'}
                </td>
                <td style={{ textAlign:'right' }}>
                  {(b.status === 'borrowed' || b.status === 'overdue') ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReturn({ id: b.id, title: b.title })}>Return</button>
                  ) : (
                    <span style={{ color:'var(--text-subtle)', fontSize: 13 }}>—</span>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ textAlign:'center', padding: 60, color:'var(--text-muted)', fontSize: 13.5 }}>
                {search ? 'No borrows match your search.' : 'No borrow records found.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize: 12.5, color:'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <div style={{ display:'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Previous</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      )}

      {/* ─── Issue Book Modal ─── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>

            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color:'var(--text)' }}>Issue book</h2>
              <p style={{ fontSize: 12.5, color:'var(--text-muted)', marginTop: 2 }}>
                Lend a book to an active member. Default due date is 14 days from today.
              </p>
            </div>

            <div style={{ padding: 22, display:'flex', flexDirection:'column', gap: 18 }}>
              {error && (
                <Alert type="error" message={error} onClose={() => setError('')} />
              )}

              {/* Book combobox */}
              <Combobox
                label="Book" required
                placeholder="Search by title, author, or ISBN…"
                value={form.book_id}
                display={selectedBook?.title || ''}
                onSelect={id => setForm(f => ({ ...f, book_id: id }))}
                items={books}
                renderItem={(b, active) => (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--accent-text)' : 'var(--text)' }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: 11.5, color:'var(--text-muted)', marginTop: 1, display:'flex', justifyContent:'space-between', gap: 8 }}>
                      <span>{b.author}</span>
                      <span className="mono">{b.available_copies} avail.</span>
                    </div>
                  </>
                )}
                renderSelected={b => (
                  <div style={{
                    display:'flex', alignItems:'center', gap: 8,
                    padding:'7px 10px', background:'var(--accent-soft)', borderRadius: 6,
                    border:'1px solid var(--accent-soft-2)'
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color:'var(--accent-text)', flex: 1 }}>{b.title}</span>
                    <span style={{ fontSize: 11.5, color:'var(--accent-text)', opacity: 0.7 }}>{b.available_copies} available</span>
                  </div>
                )}
              />

              {/* Member combobox */}
              <Combobox
                label="Member" required
                placeholder="Search by name, ID, or email…"
                value={form.member_id}
                display={selectedMember?.name || ''}
                onSelect={id => setForm(f => ({ ...f, member_id: id }))}
                items={members}
                renderItem={(m, active) => (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--accent-text)' : 'var(--text)' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 11.5, color:'var(--text-muted)', marginTop: 1, display:'flex', justifyContent:'space-between', gap: 8 }}>
                      <span className="mono">{m.member_id}</span>
                      <span style={{ textTransform:'capitalize' }}>{m.account_type}</span>
                    </div>
                  </>
                )}
                renderSelected={m => (
                  <div style={{
                    display:'flex', alignItems:'center', gap: 8,
                    padding:'7px 10px', background:'var(--accent-soft)', borderRadius: 6,
                    border:'1px solid var(--accent-soft-2)'
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color:'var(--accent-text)', flex: 1 }}>{m.name}</span>
                    <span className="mono" style={{ fontSize: 11.5, color:'var(--accent-text)', opacity: 0.7 }}>{m.member_id}</span>
                    <span style={{ fontSize: 11.5, color:'var(--accent-text)', opacity: 0.7, textTransform:'capitalize' }}>{m.account_type}</span>
                  </div>
                )}
              />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                {/* Due date */}
                <div>
                  <label className="label">Due date <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input className="field" type="date"
                    value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))}
                    min={new Date().toISOString().split('T')[0]} />
                  <div style={{ display:'flex', gap: 6, marginTop: 6 }}>
                    {[7, 14, 30].map(days => (
                      <button key={days} type="button" className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const d = new Date(); d.setDate(d.getDate() + days);
                          setForm(f => ({...f, due_date: d.toISOString().split('T')[0]}));
                        }}>+{days}d</button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Notes <span style={{ color:'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="field" style={{ minHeight: 70, resize:'vertical' }}
                    value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                    placeholder="Any special instructions…" />
                </div>
              </div>
            </div>

            <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap: 8, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBorrow} disabled={saving}>
                {saving ? 'Issuing…' : 'Issue book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReturn && (
        <ConfirmDialog
          title="Return book"
          message={`Confirm that "${confirmReturn.title}" has been physically returned to the library.`}
          confirmLabel="Mark as returned"
          cancelLabel="Cancel"
          tone="primary"
          onConfirm={() => { returnBook(confirmReturn.id); setConfirmReturn(null); }}
          onCancel={() => setConfirmReturn(null)}
        />
      )}
    </div>
  );
}
