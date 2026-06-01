import { Router } from 'express';
import {
  getBorrows, createBorrow, returnBook,
  getDashboardStats, getCategories,
  getBorrowRequests, approveRequest, rejectRequest,
  getMyBorrows, getMyRequests, createBorrowRequest,
  getMyNotifications, getMyTrash, deleteNotification, permanentDeleteNotification
} from '../controllers/borrowsController';
import { authenticate, authorize } from '../middleware/auth';

const r = Router();

// Stats & categories
r.get('/stats', authenticate, getDashboardStats);
r.get('/categories', authenticate, getCategories);

// Notifications (member)
r.get('/notifications', authenticate, getMyNotifications);
r.get('/notifications/trash', authenticate, getMyTrash);
r.delete('/notifications/:id', authenticate, deleteNotification);
r.delete('/notifications/:id/permanent', authenticate, permanentDeleteNotification);

// Borrow Requests — Librarian/Assistant
r.get('/requests', authenticate, authorize('librarian', 'library_assistant'), getBorrowRequests);
r.put('/requests/:id/approve', authenticate, authorize('librarian', 'library_assistant'), approveRequest);
r.put('/requests/:id/reject', authenticate, authorize('librarian', 'library_assistant'), rejectRequest);

// Member routes
r.get('/my', authenticate, getMyBorrows);
r.get('/my-requests', authenticate, getMyRequests);
r.post('/request', authenticate, createBorrowRequest);

// Staff borrow & return
r.get('/', authenticate, authorize('librarian', 'library_assistant'), getBorrows);
r.post('/', authenticate, authorize('librarian', 'library_assistant'), createBorrow);
r.put('/:id/return', authenticate, authorize('librarian', 'library_assistant'), returnBook);

export default r;
