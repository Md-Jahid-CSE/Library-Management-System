import { Request, Response } from 'express';
import pool from '../config/database';
import { sendApprovalEmail } from '../config/email';

export const getMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '');
    const status = String(req.query.status || '');
    const type = String(req.query.type || '');
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    let query = `SELECT m.*, COUNT(b.id) as active_borrows FROM members m LEFT JOIN borrows b ON m.id = b.member_id AND b.status = 'borrowed' WHERE 1=1`;
    const params: any[] = [];
    if (search) { query += ` AND (m.name LIKE ? OR m.email LIKE ? OR m.member_id LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (status) { query += ` AND m.status = ?`; params.push(status); }
    if (type) { query += ` AND m.account_type = ?`; params.push(type); }
    query += ` GROUP BY m.id ORDER BY m.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows]: any = await pool.execute(query, params);
    const countParams: any[] = [...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []), ...(status ? [status] : []), ...(type ? [type] : [])];
    const countWhere = `${search ? ' AND (name LIKE ? OR email LIKE ? OR member_id LIKE ?)' : ''}${status ? ' AND status = ?' : ''}${type ? ' AND account_type = ?' : ''}`;
    const [total]: any = await pool.execute(`SELECT COUNT(*) as count FROM members WHERE 1=1${countWhere}`, countParams);
    res.json({ success: true, data: rows, total: (total as any)[0].count });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateMemberStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  try {
    // Get member info for email
    const [members]: any = await pool.execute('SELECT * FROM members WHERE id = ?', [req.params.id]);
    await pool.execute('UPDATE members SET status = ? WHERE id = ?', [status, req.params.id]);

    // Approval email পাঠাও
    if (status === 'active' && members[0]) {
      sendApprovalEmail(members[0].name, members[0].email, members[0].member_id).catch(console.error);
    }
    res.json({ success: true, message: 'Status updated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateMember = async (req: Request, res: Response): Promise<void> => {
  const { name, email, department, batch, mobile, address, gender, status } = req.body;
  try {
    await pool.execute(
      `UPDATE members SET name=?, email=?, department=?, batch=?, mobile=?, address=?, gender=?, status=? WHERE id=?`,
      [name, email, department || null, batch || null, mobile || null, address || null, gender || null, status, req.params.id]
    );
    res.json({ success: true, message: 'Member updated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.execute('DELETE FROM members WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Member deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.execute('SELECT id, name, email, role, mobile, gender, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ? AND role != "librarian"', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
