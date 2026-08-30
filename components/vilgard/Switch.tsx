'use client';

export function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label
      className="switch"
      onClick={onChange}
    >
      <div className={`switch-track ${checked ? 'on' : ''}`}>
        <div className="switch-dot" />
      </div>
    </label>
  );
}
