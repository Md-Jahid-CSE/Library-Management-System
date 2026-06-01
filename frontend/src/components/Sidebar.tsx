import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const NAV_ICONS: Record<string, string> = {
  '/dashboard':        '🏠',
  '/books':            '📚',
  '/categories':       '🏷️',
  '/borrows':          '📋',
  '/requests':         '📥',
  '/my-borrows':       '📖',
  '/members':          '👥',
  '/create-assistant': '➕',
  '/announcements':    '📣',
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0ea5e9,#06b6d4)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#f43f5e,#e11d48)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
];

function avatarGradient(name = '') {
  let code = 0;
  for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.userType === 'user';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || isStaff) return;
    const fetchUnread = () => {
      api.get('/announcements/unread-count').then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60000);
    return () => clearInterval(id);
  }, [user, isStaff]);

  const sections: { title: string; items: { path: string; label: string; show: boolean; badge?: number }[] }[] = [
    {
      title: 'Overview',
      items: [
        { path: '/dashboard',   label: 'Dashboard',   show: true },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { path: '/books',       label: 'Books',       show: true },
        { path: '/categories',  label: 'Categories',  show: true },
      ],
    },
    {
      title: 'Circulation',
      items: [
        { path: '/borrows',     label: 'Borrows',          show: isStaff },
        { path: '/requests',    label: 'Borrow Requests',  show: isStaff },
        { path: '/my-borrows',  label: 'My Library',       show: !isStaff },
      ],
    },
    {
      title: 'People',
      items: [
        { path: '/members',          label: 'Members',         show: isStaff },
        { path: '/create-assistant', label: 'Add Assistant',   show: user?.role === 'librarian' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { path: '/announcements', label: 'Announcements', show: true, badge: isStaff ? 0 : unreadCount },
      ],
    },
  ];

  const roleLabel: Record<string,string> = {
    librarian: 'Head Librarian',
    library_assistant: 'Asst. Librarian',
    student: 'Student',
    staff: 'Staff Member',
  };

  return (
    <>
      <style>{`
        .nav-lnk {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 7px 10px; border-radius: 8px;
          font-size: 13.5px; font-weight: 500;
          color: rgba(165,180,252,0.75); text-decoration: none;
          margin-bottom: 2px;
          transition: background .13s, color .13s;
        }
        .nav-lnk:hover {
          background: rgba(129,140,248,0.12);
          color: #e0e7ff;
        }
        .nav-lnk.active {
          background: linear-gradient(90deg, rgba(99,102,241,0.32) 0%, rgba(139,92,246,0.18) 100%);
          color: #ffffff;
          font-weight: 600;
          box-shadow: inset 3px 0 0 #818cf8;
        }
        .nav-lnk .nav-icon {
          font-size: 15px;
          width: 20px; text-align: center; flex-shrink: 0;
          opacity: 0.85;
        }
        .nav-lnk.active .nav-icon { opacity: 1; }
        .nav-lnk .nav-badge {
          background: linear-gradient(135deg, #f43f5e, #e11d48);
          color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 1px 6px; border-radius: 99px;
          line-height: 1.5; min-width: 18px; text-align: center;
          box-shadow: 0 2px 6px rgba(244,63,94,0.4);
        }
        .so-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px; border-radius: 8px;
          font-size: 12.5px; font-weight: 500;
          color: rgba(165,180,252,0.65);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; font-family: inherit;
          transition: all .13s;
        }
        .so-btn:hover {
          background: rgba(244,63,94,0.15) !important;
          color: #fda4af !important;
          border-color: rgba(244,63,94,0.3) !important;
        }
      `}</style>

      <aside style={{
        width: 240, minHeight: '100vh',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #1a1740 100%)',
        borderRight: '1px solid rgba(129,140,248,0.1)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        boxShadow: '2px 0 20px rgba(0,0,0,0.25)',
      }}>

        {/* Brand */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(129,140,248,0.12)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, flexShrink: 0,
              boxShadow: '0 4px 12px rgba(99,102,241,0.45)',
            }}>📚</div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>
                LibraryMS
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(165,180,252,0.6)', marginTop: 1 }}>
                BAUST · University Library
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {sections.map(section => {
            const visible = section.items.filter(i => i.show);
            if (!visible.length) return null;
            return (
              <div key={section.title} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'rgba(129,140,248,0.4)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '0 10px 6px'
                }}>
                  {section.title}
                </div>
                {visible.map(item => (
                  <NavLink key={item.path} to={item.path}
                    className={({ isActive }) => `nav-lnk${isActive ? ' active' : ''}`}>
                    <span style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                      <span className="nav-icon">{NAV_ICONS[item.path] || '•'}</span>
                      <span>{item.label}</span>
                    </span>
                    {(item.badge ?? 0) > 0 && <span className="nav-badge">{item.badge}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 12px 14px', borderTop: '1px solid rgba(129,140,248,0.12)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 4px 10px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: avatarGradient(user?.name),
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#ffffff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(165,180,252,0.6)', marginTop: 1 }}>
                {roleLabel[user?.role || ''] || user?.role}
                {user?.member_id && <span className="mono"> · {user.member_id}</span>}
              </div>
            </div>
          </div>
          <button className="so-btn" onClick={() => { logout(); navigate('/login'); }}>
            <span style={{ fontSize: 13 }}>↩</span> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
