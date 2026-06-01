import React from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  style?: React.CSSProperties;
}

const CONFIG: Record<AlertType, {
  bg: string; border: string; stripe: string; iconBg: string; iconColor: string; text: string; muted: string;
  icon: string; defaultTitle: string;
}> = {
  success: {
    bg:           '#f0fdf4',
    border:       '#bbf7d0',
    stripe:       '#16a34a',
    iconBg:       '#dcfce7',
    iconColor:    '#15803d',
    text:         '#14532d',
    muted:        '#166534',
    icon:         '✓',
    defaultTitle: 'Success',
  },
  error: {
    bg:           '#fef2f2',
    border:       '#fecaca',
    stripe:       '#dc2626',
    iconBg:       '#fee2e2',
    iconColor:    '#dc2626',
    text:         '#7f1d1d',
    muted:        '#991b1b',
    icon:         '✕',
    defaultTitle: 'Error',
  },
  warning: {
    bg:           '#fffbeb',
    border:       '#fde68a',
    stripe:       '#d97706',
    iconBg:       '#fef3c7',
    iconColor:    '#b45309',
    text:         '#78350f',
    muted:        '#92400e',
    icon:         '!',
    defaultTitle: 'Warning',
  },
  info: {
    bg:           '#eff6ff',
    border:       '#bfdbfe',
    stripe:       '#2563eb',
    iconBg:       '#dbeafe',
    iconColor:    '#2563eb',
    text:         '#1e3a8a',
    muted:        '#1d4ed8',
    icon:         'i',
    defaultTitle: 'Note',
  },
};

export default function Alert({ type, title, message, onClose, style }: AlertProps) {
  const c = CONFIG[type];
  return (
    <div role="alert" style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '11px 14px',
      borderRadius: 8,
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderLeft: `3px solid ${c.stripe}`,
      fontFamily: 'inherit',
      fontSize: 13,
      lineHeight: 1.5,
      ...style,
    }}>
      {/* Icon badge */}
      <div style={{
        width: 20, height: 20,
        borderRadius: '50%',
        background: c.iconBg,
        color: c.iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: type === 'info' ? 11 : 10,
        fontWeight: 700,
        flexShrink: 0,
        marginTop: 1,
        fontStyle: type === 'info' ? 'italic' : 'normal',
        fontFamily: type === 'info' ? 'Georgia, serif' : 'inherit',
        border: `1px solid ${c.border}`,
      }}>
        {c.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: c.text, marginBottom: message ? 2 : 0 }}>
          {title || c.defaultTitle}
        </div>
        {message && (
          <div style={{ color: c.muted, opacity: 0.9, fontSize: 12.5 }}>
            {message}
          </div>
        )}
      </div>

      {/* Close */}
      {onClose && (
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none',
          color: c.text, opacity: 0.45,
          cursor: 'pointer', padding: '0 2px',
          fontSize: 16, lineHeight: 1,
          flexShrink: 0, marginTop: 1,
          fontFamily: 'inherit',
          transition: 'opacity .15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}
        >×</button>
      )}
    </div>
  );
}
