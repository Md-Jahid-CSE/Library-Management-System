import { Router } from 'express';
import {
  getBorrows, createBorrow, returnBook,
  getDashboardStats, getCategories,
  getBorrowRequests, approveRequest, rejectRequest,
  getMyBorrows, getMyRequests, createBorrowRequest,
  hideMyRequest, hideMyBorrow,
  getMyDeletedItems, restoreMyItem, permanentDeleteItem
} from '../controllers/borrowsController';
import { authenticate, authorize } from '../middleware/auth';

const r = Router();

r.get('/stats', authenticate, getDashboardStats);
r.get('/categories', authenticate, getCategories);

r.get('/requests', authenticate, authorize('librarian', 'library_assistant'), getBorrowRequests);
r.put('/requests/:id/approve', authenticate, authorize('librarian', 'library_assistant'), approveRequest);
r.put('/requests/:id/reject', authenticate, authorize('librarian', 'library_assistant'), rejectRequest);

// Recently Deleted — specific before :id routes
r.get('/my-deleted', authenticate, getMyDeletedItems);
r.put('/my-deleted/:id/restore', authenticate, restoreMyItem);
r.delete('/my-deleted/:id', authenticate, permanentDeleteItem);

r.get('/my', authenticate, getMyBorrows);
r.get('/my-requests', authenticate, getMyRequests);
r.post('/request', authenticate, createBorrowRequest);
r.delete('/my-requests/:id', authenticate, hideMyRequest);
r.delete('/my-borrows/:id', authenticate, hideMyBorrow);

r.get('/', authenticate, authorize('librarian', 'library_assistant'), getBorrows);
r.post('/', authenticate, authorize('librarian', 'library_assistant'), createBorrow);
r.put('/:id/return', authenticate, authorize('librarian', 'library_assistant'), returnBook);

export default r;
