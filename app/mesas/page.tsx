'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Scroll, Trash, UsersThree, CrownSimple, Monitor, X, Check } from '@phosphor-icons/react';
import { getTablesService, GET_TABLES_KEY } from '@/resources/table/services/getTables';
import { createTableService } from '@/resources/table/services/createTable';
import { deleteTableService } from '@/resources/table/services/deleteTable';
import { IconButton } from '@/components/vilgard/IconButton';
import { Button } from '@/components/vilgard/Button';
import { Modal } from '@/components/vilgard/Modal';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';

export default function MesasPage() {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: GET_TABLES_KEY, queryFn: getTablesService });

  const createMutation = useMutation({
    mutationFn: () => createTableService({ body: { name: newName.trim() || undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLES_KEY });
      setNewName('');
      setShowNewForm(false);
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível criar a mesa. Tente novamente.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteTableService({ code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLES_KEY });
      setConfirmDeleteCode(null);
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível excluir a mesa. Tente novamente.');
      setConfirmDeleteCode(null);
    },
  });

  const tables = data?.data ?? [];
  const tableToDelete = tables.find((table) => table.code === confirmDeleteCode) ?? null;

  return (
    <div className="table-bg">
      <header className="topbar">
        <Link
          href="/"
          className="icon-btn"
        >
          <ArrowLeft weight="bold" />
        </Link>

        <span className="brand">
          <Scroll
            weight="fill"
            color="var(--gold)"
          />
          Suas Mesas
        </span>

        <Button
          variant="primary"
          onClick={() => setShowNewForm((v) => !v)}
        >
          <Plus weight="bold" />
          Nova mesa
        </Button>
      </header>

      <main className="board tables-board">
        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        {showNewForm ? (
          <div className="add-form fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: 'var(--heading)', fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold-light)', margin: 0 }}>
                Nova mesa
              </p>

              <IconButton
                icon={<X weight="bold" />}
                onClick={() => setShowNewForm(false)}
              />
            </div>

            <input
              className="field"
              placeholder="Nome da mesa"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <Button
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              <Check weight="bold" />
              Criar mesa
            </Button>
          </div>
        ) : null}

        {tables.map((table) => (
          <div
            key={table.code}
            className="card table-card fade"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3>{table.name ?? 'Mesa sem nome'}</h3>

              <IconButton
                icon={<Trash weight="bold" />}
                onClick={() => setConfirmDeleteCode(table.code)}
                title="Excluir mesa"
              />
            </div>

            <span className="meta">
              <UsersThree weight="fill" />
              {table.code}
            </span>

            <div className="table-actions">
              <Link
                href={`/mesa/${table.code}/mestre`}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <CrownSimple weight="bold" />
                Mestrar
              </Link>

              <a
                href={`/mesa/${table.code}/exibicao`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                <Monitor weight="bold" />
                Exibir
              </a>
            </div>
          </div>
        ))}
      </main>

      <Modal
        open={!!confirmDeleteCode}
        onClose={() => setConfirmDeleteCode(null)}
      >
        <p className="card-modal-title">
          <Trash weight="bold" />
          {`Excluir ${tableToDelete?.name ?? 'esta mesa'}?`}
        </p>

        <p>
          Tem certeza? Esta ação não pode ser desfeita.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            onClick={() => setConfirmDeleteCode(null)}
            disabled={deleteMutation.isPending}
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            onClick={() => confirmDeleteCode && deleteMutation.mutate(confirmDeleteCode)}
            disabled={deleteMutation.isPending}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
