'use client';

export function Chip({
  color,
  icon,
  children,
  onRemove,
}: {
  color?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span
      className="chip"
      style={color ? ({ '--cond-color': color } as React.CSSProperties) : undefined}
    >
      {icon}
      <span>
        {children}
      </span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
        >
          ✕
        </button>
      ) : null}
    </span>
  );
}
