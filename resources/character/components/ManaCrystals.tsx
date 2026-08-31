'use client';

import { useEffect, useRef, useState } from 'react';

const SHARD_COUNT = 5;

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
  const prevCurrentRef = useRef(current);
  const [transitions, setTransitions] = useState<Record<number, 'crystal-shatter' | 'crystal-reassemble'>>({});

  useEffect(() => {
    const prev = prevCurrentRef.current;

    if (prev === current) return;

    const next: Record<number, 'crystal-shatter' | 'crystal-reassemble'> = {};

    if (current < prev) {
      for (let i = current; i < prev; i++) next[i] = 'crystal-shatter';
    } else {
      for (let i = prev; i < current; i++) next[i] = 'crystal-reassemble';
    }

    prevCurrentRef.current = current;
    setTransitions(next);

    const timeout = setTimeout(() => setTransitions({}), 600);

    return () => clearTimeout(timeout);
  }, [current]);

  if (count === 0) return null;

  return (
    <div className={`mana-crystals ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const filled = i < current;
        const n = i + 1;
        const transitionClass = transitions[i] ?? '';

        return (
          <span
            key={i}
            className={`crystal ${filled ? '' : 'empty'} ${transitionClass}`}
            style={{ '--delay': `${i * 0.18}s` } as React.CSSProperties}
            onClick={onPipClick ? (event) => {
              event.stopPropagation();
              onPipClick(current === n ? n - 1 : n);
            } : undefined}
          >
            <span className="crystal-slot" />

            <span className="crystal-gem" />

            {transitionClass ? (
              <span className="crystal-shards">
                {Array.from({ length: SHARD_COUNT }, (_, si) => (
                  <i key={si} />
                ))}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
