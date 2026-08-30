'use client';

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="error-banner"
      style={{
        background: 'rgba(168,63,74,.15)',
        border: '1px solid var(--maroon-light)',
        color: 'var(--maroon-light)',
        padding: '10px 14px',
        borderRadius: 4,
        fontSize: 13,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>
        {message}
      </span>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 13 }}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
