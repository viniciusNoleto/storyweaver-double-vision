'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Scroll, Trash, UsersThree, CrownSimple, Monitor, X, Check } from '@phosphor-icons/react';
import { getTablesService, GET_TABLES_KEY } from '@/resources/table/services/getTables';
import { createTableService } from '@/resources/table/services/createTable';
import { deleteTableService } from '@/resources/table/services/deleteTable';

export default function MesasPage() {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: GET_TABLES_KEY, queryFn: getTablesService });

  const createMutation = useMutation({
    mutationFn: () => createTableService({ body: { name: newName.trim() || undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLES_KEY });
      setNewName('');
      setShowNewForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteTableService({ code }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLES_KEY }),
  });

  const tables = data?.data ?? [];

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

        <button
          className="btn btn-primary"
          onClick={() => setShowNewForm((v) => !v)}
        >
          <Plus weight="bold" />
          Nova mesa
        </button>
      </header>

      <main className="board tables-board">
        {showNewForm ? (
          <div className="add-form fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: 'var(--heading)', fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold-light)', margin: 0 }}>
                Nova mesa
              </p>

              <button
                className="icon-btn"
                onClick={() => setShowNewForm(false)}
              >
                <X weight="bold" />
              </button>
            </div>

            <input
              className="field"
              placeholder="Nome da mesa"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <button
              className="btn btn-primary"
              onClick={() => createMutation.mutate()}
            >
              <Check weight="bold" />
              Criar mesa
            </button>
          </div>
        ) : null}

        {tables.map((table) => (
          <div
            key={table.code}
            className="card table-card fade"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3>{table.name ?? 'Mesa sem nome'}</h3>

              <button
                className="icon-btn"
                onClick={() => deleteMutation.mutate(table.code)}
                title="Excluir mesa"
              >
                <Trash weight="bold" />
              </button>
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
    </div>
  );
}
