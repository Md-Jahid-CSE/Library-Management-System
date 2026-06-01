import { Request, Response } from 'express';
import pool from '../config/database';

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '');
    const category = String(req.query.category || '');
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 12);
    const offset = (page - 1) * limit;

    let query = `SELECT b.*, c.name as category_name, c.color as category_color FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE 1=1`;
    const params: any[] = [];

    if (search) { query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (category) { query += ` AND b.category_id = ?`; params.push(Number(category)); }
    query += ` ORDER BY b.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows]: any = await pool.execute(query, params);
    const [total]: any = await pool.execute(`SELECT COUNT(*) as count FROM books WHERE 1=1${search ? ' AND (title LIKE ? OR author LIKE ?)' : ''}${category ? ' AND category_id = ?' : ''}`,
      [...(search ? [`%${search}%`, `%${search}%`] : []), ...(category ? [Number(category)] : [])]);
    res.json({ success: true, data: rows, total: (total as any)[0].count, page, limit });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  const { title, author, isbn, category_id, publisher, published_year, description, total_copies, location, language, pages } = req.body;
  try {
    const copies = Number(total_copies) || 1;
    const [result]: any = await pool.execute(
      `INSERT INTO books (title, author, isbn, category_id, publisher, published_year, description, total_copies, available_copies, location, language, pages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, isbn || null, category_id || null, publisher || null, published_year || null, description || null, copies, copies, location || null, language || 'English', pages || null]
    );
    res.status(201).json({ success: true, message: 'Book added!', bookId: (result as any).insertId });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') res.status(409).json({ success: false, message: 'ISBN already exists' });
    else res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  const { title, author, isbn, category_id, publisher, published_year, description, total_copies, location, language, pages } = req.body;
  try {
    await pool.execute(
      `UPDATE books SET title=?, author=?, isbn=?, category_id=?, publisher=?, published_year=?, description=?, total_copies=?, location=?, language=?, pages=? WHERE id=?`,
      [title, author, isbn || null, category_id || null, publisher || null, published_year || null, description || null, Number(total_copies) || 1, location || null, language || 'English', pages || null, req.params.id]
    );
    res.json({ success: true, message: 'Book updated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.execute('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Book deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
