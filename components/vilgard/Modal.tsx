'use client';

import { createPortal } from 'react-dom';

export function Modal({
  open,
  onClose,
  children,
  fullscreen = false,
  wide = false,
  contentClassName = '',
  accentColor,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullscreen?: boolean;
  wide?: boolean;
  contentClassName?: string;
  // Cor de destaque da borda/glow do modal (ex: vermelho pra dano, verde pra
  // cura) — seta a variável CSS `--modal-accent` que `.card-modal-box` já
  // lê. Sem isso, cai no dourado padrão.
  accentColor?: string;
}) {
  if (!open) return null;

  const modal = (
    <div
      className={`card-modal-backdrop ${fullscreen ? 'fullscreen' : ''}`}
      onClick={onClose}
    >
      <div
        className={`card-modal-box ${fullscreen ? 'fullscreen' : ''} ${wide ? 'edit-wide' : ''} ${contentClassName}`}
        style={accentColor ? ({ '--modal-accent': accentColor } as React.CSSProperties) : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // Modais fullscreen são portados direto pro <body> — sem isso, um botão
  // que abre o modal dentro de um ancestral com `backdrop-filter`/`filter`/
  // `transform` (ex: a topbar, que usa `backdrop-filter:blur`) vira o
  // "containing block" do `position:fixed`, e o modal fica preso dentro da
  // caixinha desse ancestral em vez de cobrir a tela inteira.
  if (fullscreen && typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return modal;
}
