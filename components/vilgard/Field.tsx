'use client';

export function Field({ className = '', ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`field ${className}`}
      {...rest}
    />
  );
}

export function FieldSelect({ className = '', ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`field ${className}`}
      {...rest}
    />
  );
}

export function FieldTextarea({ className = '', ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`field ${className}`}
      {...rest}
    />
  );
}
