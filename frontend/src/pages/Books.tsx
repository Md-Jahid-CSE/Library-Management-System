import React, { useEffect, useState, useCallback } from 'react';
import { Book, Category } from '../types';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Books() {
  const { user } = useAuth();
  const isStaff = user?.userType === 'user';
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [view, setView] = useState<'grid'|'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [toast, setToast] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<Book | null>(null);
  const blank = { title:'', author:'', isbn:'', category_id:'', publisher:'', published_year:'', description:'', total_copies:'1', available_copies:'1', location:'', language:'English', pages:'' };
  const [form, setForm] = useState(blank);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/books', { params: { search, category_id: catFilter, page, limit: 12 } });
      setBooks(data.data); setTotal(data.total);
    } finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data || [])); }, []);

  const openAdd = () => { setEditing(null); setForm(blank); setModal(true); };
  const openEdit = (b: Book) => {
    setEditing(b);
    setForm({
      title: b.title, author: b.author, isbn: b.isbn || '',
      category_id: String(b.category_id || ''), publisher: b.publisher || '',
      published_year: String(b.published_year || ''), description: b.description || '',
      total_copies: String(b.total_copies), available_copies: String(b.available_copies),
      location: b.location || '', language: b.language || 'English',
      pages: String(b.pages || '')
    });
    setModal(true);
  };

  const save = async () => {
    try {
      if (editing) { await api.put(`/books/${editing.id}`, form); setToast({ message:'Book updated.', type:'success' }); }
      else        { await api.post('/books', form);              setToast({ message:'Book added.',  type:'success' }); }
      setModal(false); load();
    } catch (e: any) { setToast({ message: e.response?.data?.message || 'Error', type:'error' }); }
  };

  const deleteBook = async (book: Book) => {
    try { await api.delete(`/books/${book.id}`); setToast({ message:`"${book.title}" deleted.`, type:'success' }); load(); }
    catch { setToast({ message:'Failed to delete.', type:'error' }); }
  };

  const borrowBook = async (book: Book) => {
    try { await api.post('/borrows/request', { book_id: book.id }); setToast({ message:`Borrow request sent for "${book.title}".`, type:'success' }); load(); }
    catch (e: any) { setToast({ message: e.response?.data?.message || 'Error', type:'error' }); }
  };

  const totalPages = Math.ceil(total / 12) || 1;

  return (
    <div className="page-enter" style={{ padding:'28px 36px', maxWidth: 1280, margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}

      {/* ─── Header ─── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 22, gap: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Catalogue</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Books</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {total.toLocaleString()} {total === 1 ? 'book' : 'books'} in the library
          </p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={openAdd}>Add book</button>
        )}
      </div>

      {/* ─── Filter bar ─── */}
      <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="field" style={{ flex:'1 1 280px', minWidth: 240 }}
          value={search} onChange={e=>{setSearch(e.target.value); setPage(1);}}
          placeholder="Search by title, author, or ISBN…" />
        <select className="field" style={{ width: 200 }}
          value={catFilter} onChange={e=>{setCatFilter(e.target.value); setPage(1);}}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div style={{ display:'flex', border:'1px solid var(--border2)', borderRadius:8, overflow:'hidden' }}>
          {(['grid','table'] as const).map(v => (
            <button key={v} onClick={()=>setView(v)}
              style={{
                padding: '7px 12px', fontSize: 12.5, fontWeight: 500,
                background: view === v ? 'var(--bg3)' : 'var(--bg2)',
                color: view === v ? 'var(--text)' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer',
                borderRight: v === 'grid' ? '1px solid var(--border2)' : 'none',
                fontFamily: 'inherit'
              }}>
              {v === 'grid' ? 'Grid' : 'Table'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Body ─── */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding: 80 }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        </div>
      ) : !books.length ? (
        <div className="card" style={{ padding:'60px 20px', textAlign:'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No books found</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Try adjusting your search or filters.
          </p>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 22 }}>
          {books.map(b => (
            <div key={b.id} className="card card-hover" style={{ padding: 16, display:'flex', flexDirection:'column' }}>

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 8, marginBottom: 10 }}>
                {b.category_name ? (
                  <span className="badge badge-neutral">{b.category_name}</span>
                ) : <span/>}
                <span className={b.available_copies > 0 ? 'badge badge-success' : 'badge badge-danger'}>
                  {b.available_copies > 0 ? `${b.available_copies} available` : 'Unavailable'}
                </span>
              </div>

              <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: 4 }}>
                {b.title}
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                {b.author}
              </p>

              <div style={{ display:'flex', gap: 14, fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 14 }}>
                {b.isbn && <span className="mono">{b.isbn}</span>}
                {b.published_year ? <span>{b.published_year}</span> : null}
              </div>

              <div style={{ marginTop:'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display:'flex', gap: 6 }}>
                {isStaff ? (
                  <>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={()=>openEdit(b)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDelete(b)}>Delete</button>
                  </>
                ) : (
                  <button className="btn btn-accent btn-sm" style={{ width: '100%' }}
                    disabled={b.available_copies < 1}
                    onClick={()=>borrowBook(b)}>
                    {b.available_copies > 0 ? 'Request to borrow' : 'Unavailable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ overflow:'hidden', marginBottom: 22 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>ISBN</th>
                <th>Year</th>
                <th>Available</th>
                <th style={{ textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.title}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{b.author}</td>
                  <td>{b.category_name ? <span className="badge badge-neutral">{b.category_name}</span> : <span style={{ color:'var(--text-subtle)' }}>—</span>}</td>
                  <td className="mono" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{b.isbn || '—'}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{b.published_year || '—'}</td>
                  <td>
                    <span className={b.available_copies > 0 ? 'badge badge-success' : 'badge badge-danger'}>
                      {b.available_copies}/{b.total_copies}
                    </span>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    {isStaff ? (
                      <div style={{ display:'inline-flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(b)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDelete(b)}>Delete</button>
                      </div>
                    ) : (
                      <button className="btn btn-accent btn-sm"
                        disabled={b.available_copies < 1}
                        onClick={()=>borrowBook(b)}>
                        {b.available_copies > 0 ? 'Request' : 'Unavailable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10 }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display:'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setPage(p => Math.max(1, p-1))} disabled={page === 1}>Previous</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      )}

      {/* ─── Modal ─── */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>

            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                  {editing ? 'Edit book' : 'Add book'}
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {editing ? 'Update the book details below.' : 'Fill in the details to add a new book to the catalogue.'}
                </p>
              </div>
              <button onClick={()=>setModal(false)}
                style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize: 20, cursor:'pointer', padding: 4, lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div style={{ padding: 22, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
              <Field span={2} label="Title"          required value={form.title}          onChange={v=>set('title',v)}          placeholder="Book title" />
              <Field        label="Author"         required value={form.author}         onChange={v=>set('author',v)}         placeholder="Author name" />
              <Field        label="ISBN"                    value={form.isbn}           onChange={v=>set('isbn',v)}           placeholder="978-…" mono />
              <div>
                <label className="label">Category</label>
                <select className="field" value={form.category_id} onChange={e=>set('category_id', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Field label="Publisher"       value={form.publisher}        onChange={v=>set('publisher',v)}        placeholder="Publisher name" />
              <Field label="Published year"  value={form.published_year}   onChange={v=>set('published_year',v)}   placeholder="e.g. 2023" />
              <Field label="Total copies"    value={form.total_copies}     onChange={v=>set('total_copies',v)}     placeholder="1" />
              <Field label="Available"       value={form.available_copies} onChange={v=>set('available_copies',v)} placeholder="1" />
              <Field label="Location"        value={form.location}         onChange={v=>set('location',v)}         placeholder="e.g. A1-S1" />
              <Field label="Language"        value={form.language}         onChange={v=>set('language',v)}         placeholder="English" />
              <Field label="Pages"           value={form.pages}            onChange={v=>set('pages',v)}            placeholder="e.g. 320" />
              <div style={{ gridColumn:'1 / -1' }}>
                <label className="label">Description</label>
                <textarea className="field" style={{ minHeight: 90, resize:'vertical' }}
                  value={form.description} onChange={e=>set('description', e.target.value)}
                  placeholder="Short description of the book…" />
              </div>
            </div>

            <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap: 8, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {editing ? 'Save changes' : 'Add book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete book"
          message={`"${confirmDelete.title}" will be permanently removed from the catalogue. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={() => { deleteBook(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, span, mono }: {
  label: string; value: string; onChange: (v: string)=>void;
  placeholder?: string; required?: boolean; span?: number; mono?: boolean;
}) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : undefined}>
      <label className="label">
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>
      <input className={'field' + (mono ? ' mono' : '')}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
