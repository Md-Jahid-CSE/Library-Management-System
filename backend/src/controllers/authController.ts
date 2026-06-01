import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { sendWelcomeEmail, sendApprovalEmail, sendPasswordResetEmail } from '../config/email';

// In-memory OTP store: email → { code, expires, name }
const resetCodes = new Map<string, { code: string; expires: number; name: string }>();

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const [users]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users[0]) {
      const isMatch = await bcrypt.compare(password, users[0].password);
      if (!isMatch) { res.status(401).json({ success: false, message: 'Invalid email or password' }); return; }
      const token = jwt.sign({ id: users[0].id, email: users[0].email, role: users[0].role, userType: 'user' }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '7d' });
      res.json({ success: true, token, user: { id: users[0].id, name: users[0].name, email: users[0].email, role: users[0].role, userType: 'user' } });
      return;
    }
    const [members]: any = await pool.execute('SELECT * FROM members WHERE email = ?', [email]);
    if (members[0]) {
      if (members[0].status === 'pending') { res.status(403).json({ success: false, message: 'Account pending approval. Please wait for librarian approval.' }); return; }
      if (members[0].status === 'suspended') { res.status(403).json({ success: false, message: 'Account suspended. Contact librarian.' }); return; }
      const isMatch = await bcrypt.compare(password, members[0].password);
      if (!isMatch) { res.status(401).json({ success: false, message: 'Invalid email or password' }); return; }
      const token = jwt.sign({ id: members[0].id, email: members[0].email, role: members[0].account_type, userType: 'member' }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '7d' });
      res.json({ success: true, token, user: { id: members[0].id, name: members[0].name, email: members[0].email, role: members[0].account_type, userType: 'member', member_id: members[0].member_id } });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { account_type, name, email, password, department, batch, mobile, address, gender, member_id } = req.body;
  try {
    if (!account_type || !name || !email || !password || !member_id) { res.status(400).json({ success: false, message: 'Required fields missing' }); return; }
    if (!['student', 'staff'].includes(account_type)) { res.status(400).json({ success: false, message: 'Invalid account type' }); return; }
    const [existing]: any = await pool.execute('SELECT id FROM members WHERE email = ? OR member_id = ?', [email, member_id]);
    if (existing[0]) { res.status(409).json({ success: false, message: 'Email or ID already registered' }); return; }
    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      `INSERT INTO members (member_id, account_type, name, email, password, department, batch, mobile, address, gender, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [member_id, account_type, name, email, hashed, department || null, account_type === 'student' ? (batch || null) : null, mobile || null, address || null, gender || null]
    );
    // Welcome email পাঠাও
    sendWelcomeEmail(name, email, member_id, account_type).catch(console.error);
    res.status(201).json({ success: true, message: 'Registration successful! Please wait for librarian approval.' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') res.status(409).json({ success: false, message: 'Email or ID already exists' });
    else { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ success: false, message: 'Email is required' }); return; }
  try {
    let name = '';
    const [users]: any = await pool.execute('SELECT name FROM users WHERE email = ?', [email]);
    if (users[0]) { name = users[0].name; }
    else {
      const [members]: any = await pool.execute('SELECT name FROM members WHERE email = ?', [email]);
      if (members[0]) name = members[0].name;
    }
    if (!name) {
      console.log(`⚠️  Forgot password: email not found in DB → ${email}`);
      res.status(404).json({ success: false, message: 'No account found with this email address.' });
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔑 Reset code for ${email}: ${code}`);
    resetCodes.set(email.toLowerCase(), { code, expires: Date.now() + 10 * 60 * 1000, name });
    try {
      await sendPasswordResetEmail(name, email, code);
    } catch (emailErr: any) {
      console.error('❌ Email send failed:', emailErr?.message || emailErr);
      resetCodes.delete(email.toLowerCase());
      res.status(500).json({ success: false, message: `Email failed: ${emailErr?.message || 'Unknown error'}` });
      return;
    }
    res.json({ success: true, message: 'Reset code sent to your email.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const verifyResetCode = async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body;
  if (!email || !code) { res.status(400).json({ success: false, message: 'Email and code are required' }); return; }
  const entry = resetCodes.get(email.toLowerCase());
  if (!entry || entry.code !== code) { res.status(400).json({ success: false, message: 'Invalid or expired code' }); return; }
  if (Date.now() > entry.expires) {
    resetCodes.delete(email.toLowerCase());
    res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    return;
  }
  res.json({ success: true, message: 'Code verified.' });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) { res.status(400).json({ success: false, message: 'All fields are required' }); return; }
  if (newPassword.length < 6) { res.status(400).json({ success: false, message: 'Password must be at least 6 characters' }); return; }
  const entry = resetCodes.get(email.toLowerCase());
  if (!entry || entry.code !== code) { res.status(400).json({ success: false, message: 'Invalid or expired code' }); return; }
  if (Date.now() > entry.expires) {
    resetCodes.delete(email.toLowerCase());
    res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    return;
  }
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [ur]: any = await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    if (ur.affectedRows === 0) {
      await pool.execute('UPDATE members SET password = ? WHERE email = ?', [hashed, email]);
    }
    resetCodes.delete(email.toLowerCase());
    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createAssistant = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, mobile, gender, address } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result]: any = await pool.execute(
      `INSERT INTO users (name, email, password, role, mobile, gender, address) VALUES (?, ?, ?, 'library_assistant', ?, ?, ?)`,
      [name, email, hashed, mobile || null, gender || null, address || null]
    );
    res.status(201).json({ success: true, message: 'Library Assistant created', id: result.insertId });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') res.status(409).json({ success: false, message: 'Email already exists' });
    else res.status(500).json({ success: false, message: 'Server error' });
  }
};
