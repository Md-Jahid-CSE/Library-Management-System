import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `"LibraryMS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`📧 Email sent to ${to}`);
};

// ১. Account Created Email
export const sendWelcomeEmail = (name: string, email: string, memberId: string, accountType: string) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0;">University Library System</p>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #1a1a2e;">Welcome, ${name}! 🎉</h2>
      <p style="color: #6b7280;">Your account has been created successfully. Please wait for librarian approval before logging in.</p>
      <div style="background: #f5f0e8; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Member ID:</strong> ${memberId}</p>
        <p style="margin: 4px 0;"><strong>Account Type:</strong> ${accountType}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> ⏳ Pending Approval</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">You will receive another email once your account is approved.</p>
    </div>
  </div>`;
  return sendEmail(email, '🎉 Account Created - LibraryMS', html);
};

// ২. Account Approved Email
export const sendApprovalEmail = (name: string, email: string, memberId: string) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #059669;">✅ Account Approved!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">Your library account has been approved. You can now login and borrow books!</p>
      <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0; color: #059669;"><strong>Member ID:</strong> ${memberId}</p>
        <p style="margin: 4px 0; color: #059669;"><strong>Status:</strong> ✅ Active</p>
      </div>
      <a href="http://localhost:3000/login" style="display: inline-block; background: #1a1a2e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Login Now →</a>
    </div>
  </div>`;
  return sendEmail(email, '✅ Account Approved - LibraryMS', html);
};

// ৩. Book Borrow Request Submitted
export const sendBorrowRequestEmail = (name: string, email: string, bookTitle: string, bookAuthor: string) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #1a1a2e;">📋 Borrow Request Submitted</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">Your borrow request has been submitted. The librarian will review and approve it shortly.</p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>📚 Book:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0;"><strong>✍️ Author:</strong> ${bookAuthor}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> ⏳ Pending Approval</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">You will be notified when your request is approved or rejected.</p>
    </div>
  </div>`;
  return sendEmail(email, '📋 Borrow Request Submitted - LibraryMS', html);
};

// ৪. Borrow Request Approved — Book Issued
export const sendBorrowApprovedEmail = (name: string, email: string, bookTitle: string, bookAuthor: string, dueDate: string) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #059669;">✅ Book Issued!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">Your borrow request has been approved. Please collect the book from the library.</p>
      <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>📚 Book:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0;"><strong>✍️ Author:</strong> ${bookAuthor}</p>
        <p style="margin: 4px 0; color: #dc2626;"><strong>📅 Due Date:</strong> ${dueDate}</p>
      </div>
      <p style="color: #dc2626; font-size: 13px;">⚠️ Please return the book by the due date to avoid fines (৳0.50 per day).</p>
    </div>
  </div>`;
  return sendEmail(email, '✅ Book Issued - LibraryMS', html);
};

// ৫. Borrow Request Rejected
export const sendBorrowRejectedEmail = (name: string, email: string, bookTitle: string, reason: string) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #dc2626;">❌ Request Rejected</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">Unfortunately, your borrow request has been rejected.</p>
      <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>📚 Book:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0; color: #dc2626;"><strong>Reason:</strong> ${reason || 'Not specified'}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">You can contact the library for more information.</p>
    </div>
  </div>`;
  return sendEmail(email, '❌ Borrow Request Rejected - LibraryMS', html);
};

// ৬. Book Returned
export const sendReturnEmail = (name: string, email: string, bookTitle: string, fine: number) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #059669;">📗 Book Returned Successfully</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">Thank you for returning the book.</p>
      <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>📚 Book:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0;"><strong>Return Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
        ${fine > 0 ? `<p style="margin: 8px 0; color: #dc2626;"><strong>💰 Fine Amount: ৳${fine.toFixed(2)}</strong></p>` : '<p style="margin: 4px 0; color: #059669;">No fine ✅</p>'}
      </div>
    </div>
  </div>`;
  return sendEmail(email, '📗 Book Returned - LibraryMS', html);
};

// ৭. Overdue Notice
export const sendOverdueEmail = (name: string, email: string, bookTitle: string, dueDate: string, daysOverdue: number) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #dc2626;">⚠️ Overdue Notice!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p style="color: #dc2626; font-weight: bold;">The following book is overdue. Please return it immediately.</p>
      <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>📚 Book:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0; color: #dc2626;"><strong>Due Date:</strong> ${dueDate}</p>
        <p style="margin: 4px 0; color: #dc2626;"><strong>Days Overdue:</strong> ${daysOverdue} days</p>
        <p style="margin: 4px 0; color: #dc2626;"><strong>Current Fine:</strong> ৳${(daysOverdue * 0.50).toFixed(2)}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Fine increases by ৳0.50 every day. Please return as soon as possible.</p>
    </div>
  </div>`;
  return sendEmail(email, '⚠️ Overdue Book Notice - LibraryMS', html);
};

// ৮. Librarian Announcement
export const sendAnnouncementEmail = (memberName: string, email: string, senderName: string, subject: string, message: string) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0;">University Library System</p>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #1a1a2e;">📢 ${subject}</h2>
      <p>Dear <strong>${memberName}</strong>,</p>
      <div style="background: #f5f0e8; border-left: 4px solid #c9a84c; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; white-space: pre-wrap; color: #374151; line-height: 1.7;">
        ${message}
      </div>
      <p style="color: #9ca3af; font-size: 13px; margin-top: 20px;">
        — <strong>${senderName}</strong><br/>
        BAUST Library Management System
      </p>
    </div>
  </div>`;
  return sendEmail(email, `📢 ${subject} - LibraryMS`, html);
};

// ৯. Password Reset OTP
export const sendPasswordResetEmail = (name: string, email: string, code: string) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 20px; border-radius: 12px;">
    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">📖 LibraryMS</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0;">University Library System</p>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 10px;">
      <h2 style="color: #1a1a2e;">🔑 Password Reset Request</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">We received a request to reset your password. Use the code below to proceed:</p>
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background: #1a1a2e; color: #c9a84c; font-size: 38px; font-weight: 900; letter-spacing: 12px; padding: 20px 36px; border-radius: 14px; border: 2px solid #c9a84c;">
          ${code}
        </div>
      </div>
      <p style="color: #dc2626; font-size: 13px; text-align: center;">⚠️ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">If you didn't request a password reset, please ignore this email.</p>
    </div>
  </div>`;
  return sendEmail(email, '🔑 Password Reset Code - LibraryMS', html);
};

export default transporter;
