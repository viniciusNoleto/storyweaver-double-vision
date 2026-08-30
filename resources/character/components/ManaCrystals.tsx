'use client';

export function ManaCrystals({
  current,
  max,
  onPipClick,
  className = '',
}: {
  current: number;
  max: number;
  onPipClick?: (value: number) => void;
  className?: string;
}) {
  const count = max > 0 ? Math.min(8, max) : 0;

  if (count === 0) return null;

  return (
    <div className={`mana-crystals ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const filled = i < current;
        const n = i + 1;

        return (
          <span
            key={i}
            className={`crystal ${filled ? '' : 'empty'}`}
            style={{ '--delay': `${i * 0.18}s` } as React.CSSProperties}
            onClick={onPipClick ? (event) => {
              event.stopPropagation();
              onPipClick(current === n ? n - 1 : n);
            } : undefined}
          />
        );
      })}
    </div>
  );
}
