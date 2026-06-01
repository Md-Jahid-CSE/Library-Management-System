import { Router } from 'express';
import { sendAnnouncement, getSentAnnouncements, getMyAnnouncements, markAnnouncementRead, getUnreadCount, deleteAnnouncement } from '../controllers/announcementsController';
import { authenticate, authorize } from '../middleware/auth';

const r = Router();

// Librarian / Assistant routes
r.post('/send', authenticate, authorize('librarian', 'library_assistant'), sendAnnouncement);
r.get('/sent', authenticate, authorize('librarian', 'library_assistant'), getSentAnnouncements);
r.delete('/:id', authenticate, authorize('librarian'), deleteAnnouncement);

// Member routes
r.get('/my', authenticate, getMyAnnouncements);
r.get('/unread-count', authenticate, getUnreadCount);
r.put('/:id/read', authenticate, markAnnouncementRead);

export default r;
