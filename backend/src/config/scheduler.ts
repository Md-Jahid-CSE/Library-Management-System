import pool from './database';
import { sendOverdueEmail } from './email';

// প্রতিদিন রাত ৮টায় overdue check করবে
export const startOverdueChecker = () => {
  const checkOverdue = async () => {
    try {
      // আজকে overdue হয়েছে এমন বই
      const [overdueBooks]: any = await pool.execute(
        `SELECT br.*, bk.title, m.name as member_name, m.email as member_email,
                DATEDIFF(CURDATE(), br.due_date) as days_overdue
         FROM borrows br
         JOIN books bk ON br.book_id = bk.id
         JOIN members m ON br.member_id = m.id
         WHERE br.status = 'borrowed' AND br.due_date < CURDATE()`
      );

      // overdue status update করো
      if (overdueBooks.length > 0) {
        await pool.execute(
          `UPDATE borrows SET status = 'overdue' WHERE status = 'borrowed' AND due_date < CURDATE()`
        );

        // প্রতিটা overdue member কে email পাঠাও
        for (const book of overdueBooks) {
          sendOverdueEmail(
            book.member_name,
            book.member_email,
            book.title,
            book.due_date.toISOString().split('T')[0],
            book.days_overdue
          ).catch(console.error);
        }
        console.log(`📧 Overdue emails sent to ${overdueBooks.length} members`);
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  };

  // Server start হওয়ার সাথে সাথে একবার check করো
  checkOverdue();

  // তারপর প্রতি ২৪ ঘণ্টায় একবার
  setInterval(checkOverdue, 24 * 60 * 60 * 1000);
  console.log('⏰ Overdue checker started (runs every 24 hours)');
};
