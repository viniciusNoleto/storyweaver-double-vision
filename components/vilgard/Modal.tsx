'use client';

export function Modal({
  open,
  onClose,
  children,
  fullscreen = false,
  wide = false,
  contentClassName = '',
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullscreen?: boolean;
  wide?: boolean;
  contentClassName?: string;
}) {
  if (!open) return null;

  return (
    <div
      className={`card-modal-backdrop ${fullscreen ? 'fullscreen' : ''}`}
      onClick={onClose}
    >
      <div
        className={`card-modal-box ${fullscreen ? 'fullscreen' : ''} ${wide ? 'edit-wide' : ''} ${contentClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
