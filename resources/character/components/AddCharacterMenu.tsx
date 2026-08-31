'use client';

import { useState } from 'react';
import { CaretRight, Ghost, Plus, Sparkle, Archive, User } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { IconButton } from '@/components/vilgard/IconButton';
import { ECharacterKind } from '../enums/CharacterKind';

// Substitui o antigo botão único "Nova carta" por um menu de 2 passos: qual
// tipo (Personagem/NPC), depois qual ação (criar do zero ou reusar um
// Personagem Salvo). Componente puramente de navegação — quem realmente abre
// o wizard/formulário/picker é o componente pai, via `onCreateNew`/`onUseSaved`.
export function AddCharacterMenu({
  onCreateNew,
  onUseSaved,
}: {
  onCreateNew: (kind: `${ECharacterKind}`) => void;
  onUseSaved: (kind: `${ECharacterKind}`) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [kind, setKind] = useState<`${ECharacterKind}` | null>(null);

  function close() {
    setOpened(false);
    setKind(null);
  }

  function pickAction(action: 'new' | 'saved') {
    if (!kind) return;

    if (action === 'new') onCreateNew(kind);
    else onUseSaved(kind);

    close();
  }

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpened(true)}
      >
        <Plus weight="bold" />
        Adicionar
      </Button>

      <Modal
        open={opened}
        onClose={close}
        fullscreen
        contentClassName="wiz-box"
      >
        <div className="wiz-head">
          <div>
            <p className="wiz-eyebrow">
              Cantos e Contos
            </p>

            <p className="wiz-title">
              {kind ? `Adicionar ${kind === ECharacterKind.NPC ? 'NPC' : 'Personagem'}` : 'Adicionar'}
            </p>
          </div>

          <IconButton
            icon="✕"
            onClick={close}
          />
        </div>

        <div className="wiz-divider" />

        {!kind ? (
          <>
            <p className="wiz-sub">
              O que você quer adicionar à mesa?
            </p>

            <button
              type="button"
              className="wiz-big-btn"
              onClick={() => setKind(ECharacterKind.CHARACTER)}
            >
              <span className="wiz-big-badge">
                <User weight="fill" />
              </span>

              <span className="wiz-opt-txt">
                <span>
                  Personagem
                </span>

                <span className="wiz-opt-sub">
                  Um herói jogável, com espécie, classe e origem
                </span>
              </span>

              <CaretRight
                weight="bold"
                className="wiz-chevron"
              />
            </button>

            <button
              type="button"
              className="wiz-big-btn"
              onClick={() => setKind(ECharacterKind.NPC)}
            >
              <span className="wiz-big-badge">
                <Ghost weight="fill" />
              </span>

              <span className="wiz-opt-txt">
                <span>
                  NPC
                </span>

                <span className="wiz-opt-sub">
                  Uma figura rápida de adicionar à cena
                </span>
              </span>

              <CaretRight
                weight="bold"
                className="wiz-chevron"
              />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="wiz-big-btn accent"
              onClick={() => pickAction('new')}
            >
              <span className="wiz-big-badge accent">
                <Sparkle weight="fill" />
              </span>

              <span className="wiz-opt-txt">
                <span>
                  Criar novo
                </span>
              </span>

              <CaretRight
                weight="bold"
                className="wiz-chevron"
              />
            </button>

            <button
              type="button"
              className="wiz-big-btn"
              onClick={() => pickAction('saved')}
            >
              <span className="wiz-big-badge">
                <Archive weight="fill" />
              </span>

              <span className="wiz-opt-txt">
                <span>
                  Usar um personagem salvo
                </span>
              </span>

              <CaretRight
                weight="bold"
                className="wiz-chevron"
              />
            </button>

            <button
              type="button"
              className="wiz-back"
              onClick={() => setKind(null)}
            >
              Voltar
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
