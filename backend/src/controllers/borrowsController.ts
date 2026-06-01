import { Request, Response } from 'express';
import pool from '../config/database';
import {
  sendBorrowRequestEmail,
  sendBorrowApprovedEmail,
  sendBorrowRejectedEmail,
  sendReturnEmail,
} from '../config/email';

export const getBorrows = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = String(req.query.status || '');
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;
    let query = `SELECT br.*, bk.title, bk.author, m.name as member_name, m.member_id as member_code, m.account_type FROM borrows br JOIN books bk ON br.book_id = bk.id JOIN members m ON br.member_id = m.id WHERE 1=1`;
    const params: any[] = [];
    if (status) { query += ` AND br.status = ?`; params.push(status); }
    query += ` ORDER BY br.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows]: any = await pool.execute(query, params);
    const [total]: any = await pool.execute(`SELECT COUNT(*) as count FROM borrows${status ? ' WHERE status = ?' : ''}`, status ? [status] : []);
    res.json({ success: true, data: rows, total: (total as any)[0].count });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createBorrow = async (req: Request, res: Response): Promise<void> => {
  const { book_id, member_id, due_date } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [book]: any = await conn.execute('SELECT available_copies FROM books WHERE id = ? FOR UPDATE', [book_id]);
    if (!book[0] || book[0].available_copies < 1) { await conn.rollback(); res.status(400).json({ success: false, message: 'Book not available' }); return; }
    await conn.execute('INSERT INTO borrows (book_id, member_id, due_date) VALUES (?, ?, ?)', [book_id, member_id, due_date]);
    await conn.execute('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book_id]);
    await conn.commit();
    res.status(201).json({ success: true, message: 'Book issued!' });
  } catch (err) { await conn.rollback(); console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
  finally { conn.release(); }
};

export const returnBook = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [borrow]: any = await conn.execute(
      `SELECT br.*, bk.title, m.name as member_name, m.email as member_email
       FROM borrows br JOIN books bk ON br.book_id = bk.id JOIN members m ON br.member_id = m.id
       WHERE br.id = ? FOR UPDATE`,
      [req.params.id]
    );
    if (!borrow[0] || borrow[0].status === 'returned') { await conn.rollback(); res.status(400).json({ success: false, message: 'Invalid' }); return; }
    const overdueDays = Math.max(0, Math.floor((new Date().getTime() - new Date(borrow[0].due_date).getTime()) / 86400000));
    const fine = parseFloat((overdueDays * 0.50).toFixed(2));
    await conn.execute(`UPDATE borrows SET return_date = CURDATE(), status = 'returned', fine_amount = ? WHERE id = ?`, [fine, req.params.id]);
    await conn.execute('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [borrow[0].book_id]);
    await conn.commit();
    // Return email
    sendReturnEmail(borrow[0].member_name, borrow[0].member_email, borrow[0].title, fine).catch(console.error);
    res.json({ success: true, message: 'Returned!', fine, overdueDays });
  } catch (err) { await conn.rollback(); res.status(500).json({ success: false, message: 'Server error' }); }
  finally { conn.release(); }
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [[totalBooks]]: any = await pool.execute('SELECT COUNT(*) as count FROM books');
    const [[totalMembers]]: any = await pool.execute('SELECT COUNT(*) as count FROM members WHERE status = "active"');
    const [[pendingMembers]]: any = await pool.execute('SELECT COUNT(*) as count FROM members WHERE status = "pending"');
    const [[activeBorrows]]: any = await pool.execute(`SELECT COUNT(*) as count FROM borrows WHERE status = 'borrowed'`);
    const [[overdueBorrows]]: any = await pool.execute(`SELECT COUNT(*) as count FROM borrows WHERE status = 'borrowed' AND due_date < CURDATE()`);
    const [[pendingRequests]]: any = await pool.execute(`SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'pending'`);
    const [recentBorrows]: any = await pool.execute(`SELECT br.*, bk.title, m.name as member_name, m.account_type FROM borrows br JOIN books bk ON br.book_id = bk.id JOIN members m ON br.member_id = m.id ORDER BY br.created_at DESC LIMIT 5`);
    const [popularBooks]: any = await pool.execute(`SELECT bk.title, bk.author, COUNT(br.id) as borrow_count FROM borrows br JOIN books bk ON br.book_id = bk.id GROUP BY bk.id ORDER BY borrow_count DESC LIMIT 5`);
    res.json({ success: true, data: { totalBooks: totalBooks.count, totalMembers: totalMembers.count, pendingMembers: pendingMembers.count, pendingRequests: pendingRequests.count, activeBorrows: activeBorrows.count, overdueBorrows: overdueBorrows.count, recentBorrows, popularBooks } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.execute(`SELECT c.*, COUNT(b.id) as book_count FROM categories c LEFT JOIN books b ON c.id = b.category_id GROUP BY c.id`);
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Borrow Requests
export const getBorrowRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = String(req.query.status || 'pending');
    const [rows]: any = await pool.execute(
      `SELECT br.*, bk.title, bk.author, bk.available_copies,
              m.name as member_name, m.member_id as member_code, m.account_type,
              m.department, m.batch, m.mobile, m.email as member_email,
              u.name as reviewed_by_name
       FROM borrow_requests br
       JOIN books bk ON br.book_id = bk.id
       JOIN members m ON br.member_id = m.id
       LEFT JOIN users u ON br.reviewed_by = u.id
       WHERE br.status = ? ORDER BY br.request_date DESC`,
      [status]
    );
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const approveRequest = async (req: any, res: Response): Promise<void> => {
  const { due_date } = req.body;
  const reviewerId = req.user.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [requests]: any = await conn.execute(
      `SELECT br.*, bk.title, bk.author, m.name as member_name, m.email as member_email
       FROM borrow_requests br JOIN books bk ON br.book_id = bk.id JOIN members m ON br.member_id = m.id
       WHERE br.id = ? FOR UPDATE`,
      [req.params.id]
    );
    if (!requests[0] || requests[0].status !== 'pending') { await conn.rollback(); res.status(400).json({ success: false, message: 'Request not found or already processed' }); return; }
    const [book]: any = await conn.execute('SELECT available_copies FROM books WHERE id = ? FOR UPDATE', [requests[0].book_id]);
    if (!book[0] || book[0].available_copies < 1) { await conn.rollback(); res.status(400).json({ success: false, message: 'Book not available' }); return; }

    const dueDate = due_date || (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; })();

    await conn.execute('INSERT INTO borrows (book_id, member_id, due_date) VALUES (?, ?, ?)', [requests[0].book_id, requests[0].member_id, dueDate]);
    await conn.execute('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [requests[0].book_id]);
    await conn.execute(`UPDATE borrow_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`, [reviewerId, req.params.id]);
    await conn.commit();

    // Insert notification for member
    insertNotification(requests[0].member_id, Number(req.params.id), 'approved', requests[0].title).catch(console.error);

    // Approval email
    sendBorrowApprovedEmail(requests[0].member_name, requests[0].member_email, requests[0].title, requests[0].author, dueDate).catch(console.error);
    res.json({ success: true, message: 'Request approved! Book issued.' });
  } catch (err) { await conn.rollback(); console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
  finally { conn.release(); }
};

export const rejectRequest = async (req: any, res: Response): Promise<void> => {
  const { reject_reason } = req.body;
  const reviewerId = req.user.id;
  try {
    const [requests]: any = await pool.execute(
      `SELECT br.*, bk.title, m.name as member_name, m.email as member_email
       FROM borrow_requests br JOIN books bk ON br.book_id = bk.id JOIN members m ON br.member_id = m.id
       WHERE br.id = ?`,
      [req.params.id]
    );
    await pool.execute(`UPDATE borrow_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), reject_reason = ? WHERE id = ?`, [reviewerId, reject_reason || 'Request rejected', req.params.id]);

    // Insert notification for member
    if (requests[0]) {
      insertNotification(requests[0].member_id, Number(req.params.id), 'rejected', requests[0].title, reject_reason).catch(console.error);
    }

    // Rejection email
    if (requests[0]) {
      sendBorrowRejectedEmail(requests[0].member_name, requests[0].member_email, requests[0].title, reject_reason || 'Request rejected').catch(console.error);
    }
    res.json({ success: true, message: 'Request rejected.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMyBorrows = async (req: any, res: Response): Promise<void> => {
  try {
    try { await pool.execute(`ALTER TABLE borrows ADD COLUMN hidden_by_member TINYINT(1) DEFAULT 0`); } catch(_) {}
    const [rows]: any = await pool.execute(
      `SELECT br.*, bk.title, bk.author FROM borrows br JOIN books bk ON br.book_id = bk.id WHERE br.member_id = ? AND (br.hidden_by_member IS NULL OR br.hidden_by_member = 0) ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const hideMyBorrow = async (req: any, res: Response): Promise<void> => {
  try {
    try { await pool.execute(`ALTER TABLE borrows ADD COLUMN hidden_by_member TINYINT(1) DEFAULT 0`); } catch(_) {}
    try { await pool.execute(`ALTER TABLE borrows ADD COLUMN hidden_at DATETIME NULL`); } catch(_) {}
    await pool.execute(
      `UPDATE borrows SET hidden_by_member = 1, hidden_at = NOW() WHERE id = ? AND member_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMyDeletedItems = async (req: any, res: Response): Promise<void> => {
  try {
    // Auto-cleanup items older than 30 days (permanent delete from borrows hidden list)
    await pool.execute(
      `UPDATE borrows SET hidden_by_member = 0, hidden_at = NULL WHERE member_id = ? AND hidden_by_member = 1 AND hidden_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [req.user.id]
    ).catch(()=>{});
    await pool.execute(
      `UPDATE borrow_requests SET hidden_by_member = 0, deleted_at = NULL WHERE member_id = ? AND hidden_by_member = 1 AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [req.user.id]
    ).catch(()=>{});

    const [borrows]: any = await pool.execute(
      `SELECT br.id, 'borrow' as item_type, bk.title, bk.author, br.status, br.hidden_at as deleted_at
       FROM borrows br JOIN books bk ON br.book_id = bk.id
       WHERE br.member_id = ? AND br.hidden_by_member = 1`,
      [req.user.id]
    ).catch(() => [[]]);

    const [requests]: any = await pool.execute(
      `SELECT br.id, 'request' as item_type, bk.title, bk.author, br.status, br.deleted_at
       FROM borrow_requests br JOIN books bk ON br.book_id = bk.id
       WHERE br.member_id = ? AND br.hidden_by_member = 1`,
      [req.user.id]
    ).catch(() => [[]]);

    const all = [...(borrows||[]), ...(requests||[])].sort((a:any,b:any) =>
      new Date(b.deleted_at||0).getTime() - new Date(a.deleted_at||0).getTime()
    );
    res.json({ success: true, data: all });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const restoreMyItem = async (req: any, res: Response): Promise<void> => {
  const { item_type } = req.body;
  try {
    if (item_type === 'borrow') {
      await pool.execute(`UPDATE borrows SET hidden_by_member = 0, hidden_at = NULL WHERE id = ? AND member_id = ?`, [req.params.id, req.user.id]);
    } else {
      await pool.execute(`UPDATE borrow_requests SET hidden_by_member = 0, deleted_at = NULL WHERE id = ? AND member_id = ?`, [req.params.id, req.user.id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMyRequests = async (req: any, res: Response): Promise<void> => {
  try {
    // Add column if missing (safe for all MySQL versions)
    try { await pool.execute(`ALTER TABLE borrow_requests ADD COLUMN hidden_by_member TINYINT(1) DEFAULT 0`); } catch(_) {}
    const [rows]: any = await pool.execute(
      `SELECT br.*, bk.title, bk.author FROM borrow_requests br JOIN books bk ON br.book_id = bk.id WHERE br.member_id = ? AND (br.hidden_by_member IS NULL OR br.hidden_by_member = 0) ORDER BY br.request_date DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const hideMyRequest = async (req: any, res: Response): Promise<void> => {
  try {
    try { await pool.execute(`ALTER TABLE borrow_requests ADD COLUMN hidden_by_member TINYINT(1) DEFAULT 0`); } catch(_) {}
    try { await pool.execute(`ALTER TABLE borrow_requests ADD COLUMN deleted_at DATETIME NULL`); } catch(_) {}
    await pool.execute(
      `UPDATE borrow_requests SET hidden_by_member = 1, deleted_at = NOW() WHERE id = ? AND member_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createBorrowRequest = async (req: any, res: Response): Promise<void> => {
  const { book_id } = req.body;
  const memberId = req.user.id;
  try {
    const [book]: any = await pool.execute('SELECT * FROM books WHERE id = ?', [book_id]);
    if (!book[0]) { res.status(404).json({ success: false, message: 'Book not found' }); return; }
    if (book[0].available_copies < 1) { res.status(400).json({ success: false, message: 'Book not available right now' }); return; }

    const [existing]: any = await pool.execute(`SELECT id FROM borrow_requests WHERE book_id = ? AND member_id = ? AND status = 'pending'`, [book_id, memberId]);
    if (existing[0]) { res.status(400).json({ success: false, message: 'You already have a pending request for this book' }); return; }

    const [borrowed]: any = await pool.execute(`SELECT id FROM borrows WHERE book_id = ? AND member_id = ? AND status = 'borrowed'`, [book_id, memberId]);
    if (borrowed[0]) { res.status(400).json({ success: false, message: 'You already have this book' }); return; }

    // Get member info for email
    const [member]: any = await pool.execute('SELECT * FROM members WHERE id = ?', [memberId]);
    const [newReq]: any = await pool.execute('INSERT INTO borrow_requests (book_id, member_id) VALUES (?, ?)', [book_id, memberId]);
    // Insert pending notification
    insertNotification(memberId, (newReq as any).insertId, 'pending', book[0].title).catch(console.error);

    // Request email
    if (member[0]) {
      sendBorrowRequestEmail(member[0].name, member[0].email, book[0].title, book[0].author).catch(console.error);
    }
    res.status(201).json({ success: true, message: 'Borrow request submitted! Waiting for library approval.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════
// NOTIFICATION / TRASH SYSTEM
// ═══════════════════════════════════════

// Auto-create notifications table if not exists
const ensureNotifTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      request_id INT,
      type ENUM('approved','rejected','pending') NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      is_deleted TINYINT(1) DEFAULT 0,
      deleted_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);
};

// Get notifications for logged-in member
export const getMyNotifications = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureNotifTable();
    const [rows]: any = await pool.execute(
      `SELECT * FROM notifications WHERE member_id = ? AND is_deleted = 0 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

// Get trash (deleted, within 30 days)
export const getMyTrash = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureNotifTable();
    const [rows]: any = await pool.execute(
      `SELECT * FROM notifications WHERE member_id = ? AND is_deleted = 1 AND deleted_at > DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY deleted_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Soft-delete (move to trash)
export const deleteNotification = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureNotifTable();
    await pool.execute(
      `UPDATE notifications SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND member_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Moved to trash' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Permanent delete from trash
export const permanentDeleteNotification = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureNotifTable();
    await pool.execute(
      `DELETE FROM notifications WHERE id = ? AND member_id = ? AND is_deleted = 1`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Permanently deleted' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const permanentDeleteItem = async (req: any, res: Response): Promise<void> => {
  const { item_type } = req.body;
  try {
    if (item_type === 'borrow') {
      await pool.execute(
        `UPDATE borrows SET hidden_by_member = 2 WHERE id = ? AND member_id = ? AND hidden_by_member = 1`,
        [req.params.id, req.user.id]
      );
    } else {
      await pool.execute(
        `UPDATE borrow_requests SET hidden_by_member = 2 WHERE id = ? AND member_id = ? AND hidden_by_member = 1`,
        [req.params.id, req.user.id]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Helper: insert notification (called from approve/reject)
export const insertNotification = async (memberId: number, requestId: number, type: string, bookTitle: string, reason?: string) => {
  try {
    await ensureNotifTable();
    const messages: any = {
      approved: `Your borrow request for "${bookTitle}" has been approved! The book is ready for pickup.`,
      rejected: `Your borrow request for "${bookTitle}" was rejected.${reason ? ` Reason: ${reason}` : ''}`,
      pending:  `Your borrow request for "${bookTitle}" has been submitted and is waiting for approval.`,
    };
    await pool.execute(
      `INSERT INTO notifications (member_id, request_id, type, title, message) VALUES (?, ?, ?, ?, ?)`,
      [memberId, requestId, type, bookTitle, messages[type] || '']
    );
  } catch (err) { console.error('Notification insert error:', err); }
};
