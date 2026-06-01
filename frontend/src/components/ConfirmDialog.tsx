import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const TONE = {
  danger:  { btn: 'btn btn-danger',   icon: '✕', iconBg: '#fee2e2', iconColor: '#dc2626', iconBorder: '#fca5a5' },
  warning: { btn: 'btn btn-primary',  icon: '!', iconBg: '#fef3c7', iconColor: '#b45309', iconBorder: '#fcd34d' },
  primary: { btn: 'btn btn-primary',  icon: '?', iconBg: '#dbeafe', iconColor: '#2563eb', iconBorder: '#93c5fd' },
};

export default function ConfirmDialog({
  title, message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  tone = 'danger',
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  const t = TONE[tone];

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 400 }}>

        <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: t.iconBg, border: `1px solid ${t.iconBorder}`,
            color: t.iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700,
            margin: '0 auto 16px',
            fontFamily: tone === 'primary' ? 'Georgia, serif' : 'inherit',
            fontStyle: tone === 'primary' ? 'italic' : 'normal',
          }}>
            {t.icon}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {title}
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
            {message}
          </p>
        </div>

        <div style={{
          padding: '20px 24px 24px',
          display: 'flex', gap: 10, justifyContent: 'center',
          flexDirection: 'row-reverse',
        }}>
          <button className={t.btn} style={{ minWidth: 100 }} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn btn-ghost" style={{ minWidth: 100 }} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
