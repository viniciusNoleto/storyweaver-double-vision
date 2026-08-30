'use client';

export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;

  return (
    <input
      className={`field ${className}`}
      {...rest}
    />
  );
}

export function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props;

  return (
    <select
      className={`field ${className}`}
      {...rest}
    />
  );
}

export function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;

  return (
    <textarea
      className={`field ${className}`}
      {...rest}
    />
  );
}
