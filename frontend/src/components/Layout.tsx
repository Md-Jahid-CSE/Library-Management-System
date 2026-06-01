import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../hooks/useTheme';

export default function Layout() {
  const { theme } = useTheme();
  const location = useLocation();
  const [displayPath, setDisplayPath] = useState(location.pathname);
  const [animKey, setAnimKey] = useState(0);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    setDisplayPath(location.pathname);
    setAnimKey(k => k + 1);
  }, [location.pathname]);

  return (
    <div data-theme={theme} style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      <Sidebar />
      <main key={animKey} style={{
        flex:1, overflowY:'auto', minWidth:0, width:'100%',
      }}>
        <Outlet key={displayPath} />
      </main>
    </div>
  );
}
