'use client';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export function Button({ variant = 'ghost', className = '', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  );
}
