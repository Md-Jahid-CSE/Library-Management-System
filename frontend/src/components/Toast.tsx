import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const CONFIG: Record<ToastType, {
  stripe: string; bg: string; border: string;
  iconBg: string; iconColor: string; iconBorder: string;
  text: string; muted: string; icon: string; title: string;
}> = {
  success: {
    stripe:      '#16a34a',
    bg:          '#f0fdf4',
    border:      '#bbf7d0',
    iconBg:      '#dcfce7',
    iconColor:   '#15803d',
    iconBorder:  '#86efac',
    text:        '#14532d',
    muted:       '#166534',
    icon:        '✓',
    title:       'Success',
  },
  error: {
    stripe:      '#dc2626',
    bg:          '#fef2f2',
    border:      '#fecaca',
    iconBg:      '#fee2e2',
    iconColor:   '#dc2626',
    iconBorder:  '#fca5a5',
    text:        '#7f1d1d',
    muted:       '#991b1b',
    icon:        '✕',
    title:       'Error',
  },
  warning: {
    stripe:      '#d97706',
    bg:          '#fffbeb',
    border:      '#fde68a',
    iconBg:      '#fef3c7',
    iconColor:   '#b45309',
    iconBorder:  '#fcd34d',
    text:        '#78350f',
    muted:       '#92400e',
    icon:        '!',
    title:       'Warning',
  },
  info: {
    stripe:      '#2563eb',
    bg:          '#eff6ff',
    border:      '#bfdbfe',
    iconBg:      '#dbeafe',
    iconColor:   '#2563eb',
    iconBorder:  '#93c5fd',
    text:        '#1e3a8a',
    muted:       '#1d4ed8',
    icon:        'i',
    title:       'Info',
  },
};

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [closing, setClosing] = useState(false);
  const c = CONFIG[type];

  useEffect(() => {
    const t = setTimeout(() => {
      setClosing(true);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const dismiss = () => { setClosing(true); setTimeout(onClose, 200); };

  return (
    <>
      <style>{`
        @keyframes toastIn  { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes toastOut { from{opacity:1;transform:translateY(0) scale(1)}       to{opacity:0;transform:translateY(10px) scale(.97)} }
        @keyframes toastBar { from{transform:scaleX(1)} to{transform:scaleX(0)} }
        .toast-close:hover { opacity: 0.8 !important; }
      `}</style>

      <div role="status" aria-live="polite"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 400,
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderLeft: `4px solid ${c.stripe}`,
          borderRadius: 10,
          boxShadow: '0 12px 32px rgba(16,24,40,0.13), 0 4px 12px rgba(16,24,40,0.08)',
          overflow: 'hidden',
          animation: closing
            ? 'toastOut .2s ease forwards'
            : 'toastIn .28s cubic-bezier(.16,1,.3,1) forwards',
          fontFamily: 'inherit',
        }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '15px 16px 12px' }}>

          {/* Icon */}
          <div style={{
            width: 26, height: 26,
            borderRadius: '50%',
            background: c.iconBg,
            border: `1px solid ${c.iconBorder}`,
            color: c.iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: type === 'info' ? 11 : 10,
            fontWeight: 700,
            flexShrink: 0,
            marginTop: 1,
            fontStyle: type === 'info' ? 'italic' : 'normal',
            fontFamily: type === 'info' ? 'Georgia, serif' : 'inherit',
          }}>
            {c.icon}
          </div>

          {/* Body */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 3 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 13, color: c.muted, opacity: 0.9, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {message}
            </div>
          </div>

          {/* Dismiss */}
          <button className="toast-close" onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: 'transparent', border: 'none',
              color: c.text, opacity: 0.4,
              cursor: 'pointer', padding: '0 2px',
              fontSize: 20, lineHeight: 1,
              flexShrink: 0,
              fontFamily: 'inherit',
              transition: 'opacity .15s',
            }}>×</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: c.border }}>
          <div style={{
            height: '100%',
            background: c.stripe,
            opacity: 0.6,
            transformOrigin: 'left center',
            animation: `toastBar ${duration}ms linear forwards`,
          }} />
        </div>
      </div>
    </>
  );
}
