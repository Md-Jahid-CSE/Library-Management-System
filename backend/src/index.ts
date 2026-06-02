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

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      /\.vercel\.app$/,
      /\.onrender\.com$/,
    ];
    if (!origin) return callback(null, true);
    const isAllowed = allowed.some(p => typeof p === 'string' ? p === origin : p.test(origin));
    callback(isAllowed ? null : new Error('CORS not allowed'), isAllowed);
  },
  credentials: true
}));
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
