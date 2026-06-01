import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '../types';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning ☀️';
  if (h >= 12 && h < 17) return 'Good afternoon 🌤️';
  if (h >= 17 && h < 21) return 'Good evening 🌆';
  return 'Good night 🌙';
}

const STAT_STYLES = [
  {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    icon: '📚',
    glow: '0 4px 20px rgba(99,102,241,0.35)',
  },
  {
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    icon: '👥',
    glow: '0 4px 20px rgba(14,165,233,0.35)',
  },
  {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    icon: '📖',
    glow: '0 4px 20px rgba(16,185,129,0.35)',
  },
  {
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    icon: '⚠️',
    glow: '0 4px 20px rgba(244,63,94,0.35)',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats|null>(null);
  const [loading, setLoading] = useState(true);
  const isStaff = user?.userType === 'user';

  useEffect(() => {
    api.get('/borrows/stats')
      .then(r => { setStats(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div style={{
        width: 24, height: 24,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin .8s linear infinite'
      }}/>
    </div>
  );

  const cards = [
    { label: 'Total books',     value: stats?.totalBooks    ?? 0, hint: 'in catalogue' },
    { label: 'Active members',  value: stats?.totalMembers  ?? 0, hint: 'enrolled students & staff' },
    { label: 'Books out',       value: stats?.activeBorrows ?? 0, hint: 'currently borrowed' },
    { label: 'Overdue',         value: stats?.overdueBorrows?? 0, hint: 'require immediate attention' },
  ];

  const roleDisplay =
    user?.role === 'librarian'         ? 'Head Librarian' :
    user?.role === 'library_assistant' ? 'Asst. Librarian' :
    user?.role === 'student'           ? 'Student' :
    'Staff Member';

  return (
    <div className="page-enter" style={{ padding: '28px 36px', maxWidth: 1280, margin: '0 auto' }}>

      {/* ─── Header banner ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 8px 32px rgba(99,102,241,0.28)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position:'absolute', top:-40, right:-40, width:180, height:180,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none'
        }}/>
        <div style={{
          position:'absolute', bottom:-30, right:100, width:120, height:120,
          borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none'
        }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgba(165,180,252,0.8)', marginBottom: 8
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(199,210,254,0.85)', marginTop: 4 }}>
            Welcome to your library dashboard. Here's today's overview.
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12, padding: '12px 18px',
          textAlign: 'right', flexShrink: 0, position:'relative', zIndex:1
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform:'uppercase', color:'rgba(165,180,252,0.8)' }}>
            Signed in as
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginTop: 3 }}>{roleDisplay}</div>
          {user?.member_id && (
            <div className="mono" style={{ fontSize: 11.5, color: 'rgba(199,210,254,0.75)', marginTop: 2 }}>
              {user.member_id}
            </div>
          )}
        </div>
      </div>

      {/* ─── Alerts ─── */}
      {isStaff && stats && stats.pendingMembers > 0 && (
        <AlertRow tone="warning"
          title={`${stats.pendingMembers} account${stats.pendingMembers>1?'s':''} waiting for approval`}
          hint="Review pending members"
          onClick={() => navigate('/members?status=pending')} />
      )}
      {isStaff && stats && stats.pendingRequests > 0 && (
        <AlertRow tone="accent"
          title={`${stats.pendingRequests} borrow request${stats.pendingRequests>1?'s':''} pending`}
          hint="Review and approve"
          onClick={() => navigate('/requests')} />
      )}

      {stats && <>
        {/* ─── Stat cards ─── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {cards.map((c, i) => {
            const s = STAT_STYLES[i];
            return (
              <div key={c.label} style={{
                background: s.gradient,
                borderRadius: 14,
                padding: '20px 20px 18px',
                boxShadow: s.glow,
                transition: 'transform .2s, box-shadow .2s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = s.glow.replace('0.35', '0.5');
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = s.glow;
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing:'0.02em' }}>
                    {c.label.toUpperCase()}
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: s.iconBg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: 18
                  }}>
                    {s.icon}
                  </div>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', lineHeight: 1 }}>
                  {c.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>{c.hint}</div>
              </div>
            );
          })}
        </div>

        {/* ─── Two columns ─── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>

          <Panel title="Recent borrows" badge={`${stats.recentBorrows.length} latest`}>
            {stats.recentBorrows.length ? (
              <div>
                {stats.recentBorrows.map((b: any) => (
                  <div key={b.id} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'10px 4px',
                    borderTop:'1px solid var(--border)'
                  }}>
                    <span className="dot" style={{
                      background: b.status === 'returned' ? 'var(--success)'
                                : b.status === 'overdue'  ? 'var(--danger)'
                                : 'var(--accent)'
                    }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:1 }}>
                        {b.member_name}
                      </div>
                    </div>
                    <span className={
                      b.status === 'returned' ? 'badge badge-success'
                      : b.status === 'overdue' ? 'badge badge-danger'
                      : 'badge badge-accent'
                    }>{b.status}</span>
                  </div>
                ))}
              </div>
            ) : <Empty>No borrows yet.</Empty>}
          </Panel>

          <Panel title="Popular books" badge="Top 5">
            {stats.popularBooks.length ? (
              <div>
                {stats.popularBooks.map((b: any, i: number) => {
                  const rankColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#f43f5e'];
                  return (
                    <div key={b.title} style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'10px 4px',
                      borderTop:'1px solid var(--border)'
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: rankColors[i] || 'var(--accent)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>{i + 1}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:1 }}>
                          {b.author}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: '#fff',
                        background: rankColors[i] || 'var(--accent)',
                        padding: '2px 8px', borderRadius: 20,
                      }}>
                        {b.borrow_count}×
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <Empty>No data yet.</Empty>}
          </Panel>
        </div>
      </>}
    </div>
  );
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</h3>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--accent)',
            background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-2)',
            padding: '2px 8px', borderRadius: 20,
          }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function AlertRow({ tone, title, hint, onClick }: { tone: 'warning' | 'accent'; title: string; hint: string; onClick: () => void }) {
  const colors = tone === 'warning'
    ? { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: 'rgba(217,119,6,0.3)', dot: '#d97706', text: '#92400e', arrow: '#d97706' }
    : { bg: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: 'rgba(99,102,241,0.3)', dot: '#6366f1', text: '#3730a3', arrow: '#6366f1' };
  return (
    <div onClick={onClick} role="button"
      style={{
        background: colors.bg, border: `1px solid ${colors.border}`,
        borderRadius: 10, padding: '11px 16px', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
      <span className="dot" style={{ background: colors.dot, animation: 'pulse-soft 2s ease-in-out infinite', width:9, height:9 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{hint}</div>
      </div>
      <span style={{ fontSize: 14, color: colors.arrow, fontWeight: 700 }}>→</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '28px 0', textAlign: 'center',
      fontSize: 13, color: 'var(--text-muted)',
      borderTop: '1px solid var(--border)'
    }}>{children}</div>
  );
}
