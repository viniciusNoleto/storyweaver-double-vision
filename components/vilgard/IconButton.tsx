'use client';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
};

export function IconButton({ icon, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
