-- ==========================================
-- Library Management System v2
-- Updated Roles: Librarian, Library Assistant, Staff, Student
-- ==========================================

CREATE DATABASE IF NOT EXISTS library_ms;
USE library_ms;

-- Drop old tables if exist
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS borrows;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users table (Librarian + Library Assistant)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('librarian', 'library_assistant') NOT NULL DEFAULT 'library_assistant',
  mobile VARCHAR(20),
  gender ENUM('male', 'female', 'other'),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Members table (Student + Staff — self register)
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id VARCHAR(30) NOT NULL UNIQUE,
  account_type ENUM('student', 'staff') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  batch VARCHAR(20),                  -- শুধু Student এর জন্য
  mobile VARCHAR(20),
  address TEXT,
  gender ENUM('male', 'female', 'other'),
  status ENUM('active', 'suspended', 'pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  category_id INT,
  publisher VARCHAR(150),
  published_year INT,
  description TEXT,
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  location VARCHAR(100),
  language VARCHAR(50) DEFAULT 'English',
  pages INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Borrows
CREATE TABLE borrows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  borrow_date DATE DEFAULT (CURRENT_DATE),
  due_date DATE NOT NULL,
  return_date DATE,
  status ENUM('borrowed', 'returned', 'overdue', 'lost') DEFAULT 'borrowed',
  fine_amount DECIMAL(10,2) DEFAULT 0.00,
  fine_paid BOOLEAN DEFAULT FALSE,
  issued_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Librarian (password: Admin@123)
INSERT INTO users (name, email, password, role, mobile, gender) VALUES
('Head Librarian', 'librarian@library.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'librarian', '01700000001', 'male'),
('Assistant One',  'assistant@library.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'library_assistant', '01700000002', 'female');

-- Categories
INSERT INTO categories (name, description, color) VALUES
('Fiction',        'Novels and short stories',              '#6366f1'),
('Non-Fiction',    'Factual books on various subjects',     '#10b981'),
('Science & Tech', 'Science, engineering and technology',   '#3b82f6'),
('History',        'Historical accounts and stories',       '#f59e0b'),
('Biography',      'Life stories of notable people',        '#ec4899'),
('Self-Help',      'Personal development and motivation',   '#8b5cf6'),
('Children',       'Books for young readers',               '#14b8a6'),
('Philosophy',     'Philosophy and critical thinking',      '#ef4444');

-- Books
INSERT INTO books (title, author, isbn, category_id, publisher, published_year, description, total_copies, available_copies, location, pages) VALUES
('The Great Gatsby',         'F. Scott Fitzgerald', '978-0743273565', 1, 'Scribner',         1925, 'A classic novel about the Jazz Age.',              5, 5, 'A1-S1', 180),
('To Kill a Mockingbird',    'Harper Lee',          '978-0061935466', 1, 'HarperCollins',    1960, 'A story of racial injustice.',                     4, 4, 'A1-S2', 324),
('1984',                     'George Orwell',       '978-0451524935', 1, 'Signet Classic',   1949, 'A dystopian social science fiction novel.',        6, 6, 'A1-S3', 328),
('Sapiens',                  'Yuval Noah Harari',   '978-0062316097', 2, 'Harper',           2015, 'A brief history of humankind.',                    3, 3, 'B1-S1', 443),
('A Brief History of Time',  'Stephen Hawking',     '978-0553380163', 3, 'Bantam',           1988, 'Cosmology for the general reader.',                3, 3, 'C1-S1', 212),
('Clean Code',               'Robert C. Martin',    '978-0132350884', 3, 'Prentice Hall',    2008, 'A handbook of agile software craftsmanship.',      3, 3, 'C1-S3', 431),
('The Alchemist',            'Paulo Coelho',        '978-0062315007', 6, 'HarperOne',        1988, 'A novel about following your dreams.',             5, 5, 'G1-S1', 197),
('Dune',                     'Frank Herbert',       '978-0441013593', 1, 'Ace',              1965, 'A science fiction epic.',                         4, 4, 'A2-S1', 688);

-- Sample Members (Students + Staff) password: password
INSERT INTO members (member_id, account_type, name, email, password, department, batch, mobile, gender, status) VALUES
('20210101', 'student', 'Alice Johnson', 'alice@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Computer Science', '2021', '01711111111', 'female', 'active'),
('20210102', 'student', 'Bob Smith',     'bob@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Electrical Eng',   '2021', '01711111112', 'male',   'active'),
('STF001',   'staff',   'Dr. Rahman',    'rahman@example.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Computer Science', NULL,   '01711111113', 'male',   'active');

-- ==========================================
-- Borrow Requests Table (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS borrow_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  reject_reason TEXT,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
