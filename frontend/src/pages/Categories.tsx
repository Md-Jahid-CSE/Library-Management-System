import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';

const COLORS = [
  '#2563eb', '#0ea5e9', '#06b6d4', '#10b981', '#16a34a',
  '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444',
  '#ec4899', '#a855f7', '#8b5cf6', '#6366f1', '#64748b',
];

export default function Categories() {
  const { user } = useAuth();
  const isStaff = user?.userType === 'user';
  const isLibrarian = user?.role === 'librarian';
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [form, setForm] = useState({ name:'', description:'', color: COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/categories')
      .then(r => { setCategories(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ name:'', description:'', color: COLORS[0] }); setError(''); setModal(true); };
  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', color: cat.color || COLORS[0] });
    setError(''); setModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        setToast({ message: `"${form.name}" updated.`, type: 'success' });
      } else {
        await api.post('/categories', form);
        setToast({ message: `"${form.name}" created.`, type: 'success' });
      }
      setModal(false); load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const del = async (cat: any) => {
    if (cat.book_count > 0) {
      setToast({ message: `Cannot delete "${cat.name}" — ${cat.book_count} book${cat.book_count>1?'s':''} assigned.`, type: 'warning' });
      return;
    }
    setConfirmDelete(cat);
  };

  const confirmDel = async () => {
    if (!confirmDelete) return;
    try { await api.delete(`/categories/${confirmDelete.id}`); setToast({ message: `"${confirmDelete.name}" deleted.`, type: 'success' }); load(); }
    catch { setToast({ message: 'Failed to delete.', type: 'error' }); }
    finally { setConfirmDelete(null); }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalBooks = categories.reduce((sum, c) => sum + Number(c.book_count || 0), 0);

  return (
    <div className="page-enter" style={{ padding: '28px 36px', maxWidth: 1280, margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Header ─── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 22, gap: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Catalogue</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Categories</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} · {totalBooks.toLocaleString()} total books classified
          </p>
        </div>
        {isStaff && <button className="btn btn-primary" onClick={openAdd}>+ Add category</button>}
      </div>

      {/* ─── Search ─── */}
      {categories.length > 0 && (
        <div className="card" style={{ padding: 12, marginBottom: 16 }}>
          <input className="field" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search categories…" />
        </div>
      )}

      {/* ─── Body ─── */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding: 80 }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        </div>
      ) : filtered.length ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map(cat => (
            <div key={cat.id} className="card card-hover" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>

              {/* Color stripe */}
              <div style={{ height: 4, background: cat.color }} />

              <div style={{ padding: '16px 18px 14px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 10, gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: cat.color + '14', border: `1px solid ${cat.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 15, color: cat.color, flexShrink: 0
                  }}>
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  {isStaff && (
                    <div style={{ display:'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cat)}>Edit</button>
                      {isLibrarian && (
                        <button className="btn btn-danger btn-sm" onClick={() => del(cat)}>Delete</button>
                      )}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {cat.name}
                </h3>
                <p style={{
                  fontSize: 12.5, color: 'var(--text-muted)',
                  lineHeight: 1.5, minHeight: 36,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {cat.description || 'No description provided.'}
                </p>

                <div style={{
                  marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'space-between'
                }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap: 5 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{cat.book_count || 0}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {cat.book_count === 1 ? 'book' : 'books'}
                    </span>
                  </div>
                  <span className="dot" style={{ background: cat.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            {search ? 'No matching categories' : 'No categories yet'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {search ? 'Try a different search term.' : isStaff ? 'Click "Add category" to create your first one.' : 'Categories will appear here once added.'}
          </p>
        </div>
      )}

      {/* ─── Modal ─── */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                {editing ? 'Edit category' : 'Add category'}
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                {editing ? 'Update the category details.' : 'Create a new category to organize your books.'}
              </p>
            </div>

            <div style={{ padding: 22 }}>
              {error && (
                <Alert type="error" message={error} onClose={() => setError('')} style={{ marginBottom: 14 }} />
              )}

              <div style={{ marginBottom: 14 }}>
                <label className="label">Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <input className="field" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="e.g. Science &amp; Technology" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Description</label>
                <textarea className="field" style={{ minHeight: 70, resize:'vertical' }}
                  value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Brief description of this category…" />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="label">Color</label>
                <div style={{ display:'flex', gap: 6, flexWrap:'wrap', marginBottom: 10 }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({...f, color: c}))}
                      style={{
                        width: 26, height: 26, borderRadius: 6, background: c,
                        border: form.color === c ? '2px solid var(--text)' : '2px solid transparent',
                        boxShadow: form.color === c ? '0 0 0 1px var(--bg2) inset' : 'none',
                        cursor: 'pointer', padding: 0
                      }}/>
                  ))}
                </div>

                {/* Live preview */}
                <div style={{
                  display:'flex', alignItems:'center', gap: 10,
                  padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)',
                  borderRadius: 8
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: form.color + '14', border: `1px solid ${form.color}33`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: 13, fontWeight: 700, color: form.color
                  }}>
                    {(form.name.charAt(0) || 'A').toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    {form.name || 'Category preview'}
                  </span>
                  <span className="dot" style={{ background: form.color, marginLeft:'auto' }} />
                </div>
              </div>
            </div>

            <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap: 8, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete category"
          message={`"${confirmDelete.name}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={confirmDel}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
