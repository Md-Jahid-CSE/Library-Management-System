import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import pool from '../config/database';
const r = Router();

r.get('/', authenticate, async (_req, res) => {
  try {
    const [rows]: any = await pool.execute(`SELECT c.*, COUNT(b.id) as book_count FROM categories c LEFT JOIN books b ON c.id = b.category_id GROUP BY c.id ORDER BY c.name`);
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

r.post('/', authenticate, authorize('librarian', 'library_assistant'), async (req, res) => {
  const { name, description, color } = req.body;
  try {
    const [result]: any = await pool.execute('INSERT INTO categories (name, description, color) VALUES (?, ?, ?)', [name, description || null, color || '#6366f1']);
    res.status(201).json({ success: true, message: 'Category created', id: (result as any).insertId });
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') res.status(409).json({ success: false, message: 'Category already exists' });
    else res.status(500).json({ success: false, message: 'Server error' });
  }
});

r.put('/:id', authenticate, authorize('librarian', 'library_assistant'), async (req, res) => {
  const { name, description, color } = req.body;
  try {
    await pool.execute('UPDATE categories SET name=?, description=?, color=? WHERE id=?', [name, description || null, color || '#6366f1', req.params.id]);
    res.json({ success: true, message: 'Category updated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

r.delete('/:id', authenticate, authorize('librarian'), async (req, res) => {
  try {
    await pool.execute('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

export default r;
