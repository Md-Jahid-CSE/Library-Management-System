import { Router } from 'express';
import { getBooks, createBook, updateBook, deleteBook } from '../controllers/booksController';
import { authenticate, authorize } from '../middleware/auth';
const r = Router();
r.get('/', authenticate, getBooks);
r.post('/', authenticate, authorize('librarian', 'library_assistant'), createBook);
r.put('/:id', authenticate, authorize('librarian', 'library_assistant'), updateBook);
r.delete('/:id', authenticate, authorize('librarian'), deleteBook);
export default r;
