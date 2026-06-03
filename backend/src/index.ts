import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { startOverdueChecker } from './config/scheduler';
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import memberRoutes from './routes/members';
import borrowRoutes from './routes/borrows';
import categoryRoutes from './routes/categories';
import announcementRoutes from './routes/announcements';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins (reflects the request origin) so every Vercel URL works,
// including preview deployments whose sub-domain hash changes on each deploy.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/announcements', announcementRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'OK' }));

const start = async () => {
  await testConnection();
  startOverdueChecker();
  app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));
};
start();
