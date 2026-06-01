import { Request, Response } from 'express';
import pool from '../config/database';
import { sendAnnouncementEmail } from '../config/email';

const ensureTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sent_by INT NOT NULL,
      sent_by_name VARCHAR(100) NOT NULL,
      recipient_type ENUM('all','students','staff','specific') NOT NULL DEFAULT 'all',
      member_id INT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      sent_count INT DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS announcement_inbox (
      id INT AUTO_INCREMENT PRIMARY KEY,
      announcement_id INT NOT NULL,
      member_id INT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      read_at DATETIME NULL,
      FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);
};

export const sendAnnouncement = async (req: any, res: Response): Promise<void> => {
  const { recipient_type, member_id, subject, message } = req.body;
  if (!subject?.trim() || !message?.trim()) {
    res.status(400).json({ success: false, message: 'Subject and message are required' });
    return;
  }

  try {
    await ensureTable();

    let recipients: { id: number; name: string; email: string }[] = [];

    if (recipient_type === 'specific') {
      if (!member_id) { res.status(400).json({ success: false, message: 'Member ID required for specific recipient' }); return; }
      const [rows]: any = await pool.execute(
        `SELECT id, name, email FROM members WHERE id = ? AND status = 'active'`, [member_id]
      );
      recipients = rows;
    } else if (recipient_type === 'students') {
      const [rows]: any = await pool.execute(
        `SELECT id, name, email FROM members WHERE account_type = 'student' AND status = 'active'`
      );
      recipients = rows;
    } else if (recipient_type === 'staff') {
      const [rows]: any = await pool.execute(
        `SELECT id, name, email FROM members WHERE account_type = 'staff' AND status = 'active'`
      );
      recipients = rows;
    } else {
      // all active members
      const [rows]: any = await pool.execute(
        `SELECT id, name, email FROM members WHERE status = 'active'`
      );
      recipients = rows;
    }

    if (recipients.length === 0) {
      res.status(404).json({ success: false, message: 'No active members found for the selected group' });
      return;
    }

    const senderName = req.user.name || 'Librarian';

    // Save announcement record
    const [result]: any = await pool.execute(
      `INSERT INTO announcements (sent_by, sent_by_name, recipient_type, member_id, subject, message, sent_count) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, senderName, recipient_type || 'all', member_id || null, subject.trim(), message.trim(), recipients.length]
    );
    const announcementId = result.insertId;

    // Save inbox entries & send emails
    let emailsSent = 0;
    const inboxValues = recipients.map(m => `(${announcementId}, ${m.id})`).join(',');
    if (inboxValues) {
      await pool.execute(`INSERT INTO announcement_inbox (announcement_id, member_id) VALUES ${inboxValues}`);
    }

    // Send emails in background (don't await all)
    recipients.forEach(member => {
      sendAnnouncementEmail(member.name, member.email, senderName, subject.trim(), message.trim())
        .then(() => { emailsSent++; })
        .catch(err => console.error(`Email failed for ${member.email}:`, err));
    });

    res.json({
      success: true,
      message: `Notification sent to ${recipients.length} member(s)`,
      sent_count: recipients.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSentAnnouncements = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureTable();
    const [rows]: any = await pool.execute(
      `SELECT a.*, m.name as member_name
       FROM announcements a
       LEFT JOIN members m ON a.member_id = m.id
       ORDER BY a.sent_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyAnnouncements = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureTable();
    const [rows]: any = await pool.execute(
      `SELECT ai.id as inbox_id, ai.is_read, ai.read_at,
              a.subject, a.message, a.sent_by_name, a.sent_at
       FROM announcement_inbox ai
       JOIN announcements a ON ai.announcement_id = a.id
       WHERE ai.member_id = ?
       ORDER BY a.sent_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markAnnouncementRead = async (req: any, res: Response): Promise<void> => {
  try {
    await pool.execute(
      `UPDATE announcement_inbox SET is_read = 1, read_at = NOW() WHERE id = ? AND member_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteAnnouncement = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'librarian') {
      res.status(403).json({ success: false, message: 'Only the Head Librarian can delete announcements.' });
      return;
    }
    const [result]: any = await pool.execute(
      `DELETE FROM announcements WHERE id = ?`, [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUnreadCount = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureTable();
    const [rows]: any = await pool.execute(
      `SELECT COUNT(*) as count FROM announcement_inbox WHERE member_id = ? AND is_read = 0`,
      [req.user.id]
    );
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
};
