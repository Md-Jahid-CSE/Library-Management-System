export interface User {
  id: number; name: string; email: string;
  role: 'librarian' | 'library_assistant' | 'student' | 'staff';
  userType: 'user' | 'member';
  member_id?: string;
}
export interface Book { id: number; title: string; author: string; isbn: string; category_id: number; category_name?: string; category_color?: string; publisher: string; published_year: number; description: string; total_copies: number; available_copies: number; location: string; language: string; pages: number; }
export interface Member { id: number; member_id: string; account_type: 'student' | 'staff'; name: string; email: string; department: string; batch?: string; mobile: string; address: string; gender: string; status: 'active' | 'suspended' | 'pending'; active_borrows?: number; created_at: string; }
export interface Borrow { id: number; book_id: number; member_id: number; title: string; author: string; member_name: string; member_code: string; account_type: string; borrow_date: string; due_date: string; return_date?: string; status: string; fine_amount: number; }
export interface Category { id: number; name: string; description: string; color: string; book_count: number; }
export interface DashboardStats { totalBooks: number; totalMembers: number; pendingMembers: number; pendingRequests: number; activeBorrows: number; overdueBorrows: number; recentBorrows: any[]; popularBooks: any[]; }
