import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import Borrows from './pages/Borrows';
import Categories from './pages/Categories';
import BorrowRequests from './pages/BorrowRequests';
import CreateAssistant from './pages/CreateAssistant';
import MyBorrows from './pages/MyBorrows';
import ForgotPassword from './pages/ForgotPassword';
import Announcements from './pages/Announcements';

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'DM Sans,sans-serif', color:'#9ca3af' }}>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};
const StaffOnly = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user?.userType === 'user' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};
const LibrarianOnly = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user?.role === 'librarian' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Protected><Layout /></Protected>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"        element={<Dashboard />} />
              <Route path="books"            element={<Books />} />
              <Route path="categories"       element={<Categories />} />
              <Route path="my-borrows"       element={<MyBorrows />} />
              <Route path="members"          element={<StaffOnly><Members /></StaffOnly>} />
              <Route path="requests"         element={<StaffOnly><BorrowRequests /></StaffOnly>} />
              <Route path="borrows"          element={<StaffOnly><Borrows /></StaffOnly>} />
              <Route path="create-assistant"  element={<LibrarianOnly><CreateAssistant /></LibrarianOnly>} />
              <Route path="announcements"    element={<Announcements />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
