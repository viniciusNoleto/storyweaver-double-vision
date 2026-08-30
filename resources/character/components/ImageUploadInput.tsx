'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadCharacterImageService } from '../services/uploadCharacterImage';

export function ImageUploadInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCharacterImageService({ file }),
    onSuccess: (res) => onChange(res.data.url),
  });

  function handleFile(file: File | undefined) {
    if (file) uploadMutation.mutate(file);
  }

  return (
    <div className="wiz-photo-center">
      <div
        className="wiz-photo-slot"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{ cursor: 'pointer', opacity: isDragging ? 0.7 : 1 }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Retrato"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Foto</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
