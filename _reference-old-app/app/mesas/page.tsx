'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Group,
  Loader,
  Menu,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Icon } from '@iconify/react';
import { getTablesService, GET_TABLES_KEY } from '@/resources/table/services/getTables';
import { useCreateTableLogicData, CreateTableLogicComponent } from '@/resources/table/logics/CreateTable';
import { useRenameTableLogicData, RenameTableLogicComponent } from '@/resources/table/logics/RenameTable';
import { useDeleteTableLogicData, DeleteTableLogicComponent } from '@/resources/table/logics/DeleteTable';
import type { ITable } from '@/resources/table/models/Table';

// Tela "/mesas" — lista única de todas as mesas já criadas (ver
// `.claude/rules/table-concept.md`). Cada mesa tem duas ações principais,
// Mestrar e Visualizar, mais Renomear/Excluir dentro do menu de 3 pontinhos.
// "Nova mesa" cria e já entra direto na Tela do Mestre (o cookie de sessão já
// foi setado pelo servidor em `POST /api/tables` — mesmo navegador, sem tela
// de revelar a chave).
export default function MesasPage() {
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [renamingTable, setRenamingTable] = useState<ITable | null>(null);
  const [deletingTable, setDeletingTable] = useState<ITable | null>(null);

  const {
    data: tablesData,
    isLoading: tablesIsLoading,
    refetch: tablesRefetch,
  } = useQuery({
    queryKey: GET_TABLES_KEY,
    queryFn: getTablesService,
  });

  const createTableLogicData = useCreateTableLogicData({
    onSuccess: ({ code }) => router.push(`/mesa/${code}/mestre`),
  });

  function openCreate() {
    createTableLogicData.createTableReset();
    setCreating(true);
  }

  const renameTableLogicData = useRenameTableLogicData({
    code: renamingTable?.code ?? null,
    onSuccess: () => {
      setRenamingTable(null);
      tablesRefetch();
    },
  });

  function openRename(table: ITable) {
    renameTableLogicData.setName(table.name ?? '');
    setRenamingTable(table);
  }

  const deleteTableLogicData = useDeleteTableLogicData({
    code: deletingTable?.code ?? null,
    onSuccess: () => {
      setDeletingTable(null);
      tablesRefetch();
    },
  });

  const tables = tablesData?.data ?? [];

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
        <Group
          justify="space-between"
          align="center"
          className="mb-6"
        >
          <Title
            order={1}
            c="primary.5"
            className="uppercase tracking-[0.08em]"
          >
            Mesas
          </Title>

          <Button
            component={Link}
            href="/"
            variant="subtle"
            color="gray"
            leftSection={(
              <Icon icon="lucide:arrow-left" />
            )}
          >
            Voltar
          </Button>
        </Group>

        <Button
          fullWidth
          onClick={openCreate}
          leftSection={(
            <Icon icon="lucide:dices" />
          )}
          className="mb-8 uppercase tracking-[0.08em]"
        >
          Nova mesa
        </Button>

        {tablesIsLoading ? (
          <div className="flex justify-center py-12">
            <Loader color="primary" />
          </div>
        ) : (
          <Stack gap="sm">
            {tables.length === 0 ? (
              <Text className="text-center text-parchment/50">
                Nenhuma mesa criada ainda.
              </Text>
            ) : null}

            {tables.map((table) => (
              <Card
                key={table.id}
                padding="md"
              >
                <Group
                  justify="space-between"
                  wrap="nowrap"
                >
                  <div className="min-w-0">
                    <Text
                      fw={700}
                      c="primary.5"
                      className="truncate font-display"
                    >
                      {table.name || 'Mesa sem nome'}
                    </Text>

                    <Text
                      size="xs"
                      className="font-accent text-parchment/50"
                    >
                      {`Código: ${table.code}`}
                    </Text>
                  </div>

                  <Group
                    gap="xs"
                    wrap="nowrap"
                  >
                    <Button
                      component={Link}
                      href={`/mesa/${table.code}/mestre`}
                      size="xs"
                      leftSection={(
                        <Icon icon="lucide:crown" />
                      )}
                    >
                      Mestrar
                    </Button>

                    <Button
                      component={Link}
                      href={`/mesa/${table.code}/exibicao`}
                      target="_blank"
                      size="xs"
                      variant="light"
                      leftSection={(
                        <Icon icon="lucide:cast" />
                      )}
                    >
                      Visualizar
                    </Button>

                    <Menu
                      position="bottom-end"
                      withinPortal
                    >
                      <Menu.Target>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="gray"
                          px="xs"
                        >
                          <Icon icon="lucide:more-vertical" />
                        </Button>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={(
                            <Icon icon="lucide:pencil" />
                          )}
                          onClick={() => openRename(table)}
                        >
                          Renomear
                        </Menu.Item>

                        <Menu.Item
                          color="secondary"
                          leftSection={(
                            <Icon icon="lucide:trash-2" />
                          )}
                          onClick={() => setDeletingTable(table)}
                        >
                          Excluir
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </div>

      <CreateTableLogicComponent
        logicData={createTableLogicData}
        opened={creating}
        onCancel={() => setCreating(false)}
      />

      <RenameTableLogicComponent
        logicData={renameTableLogicData}
        opened={!!renamingTable}
        onCancel={() => setRenamingTable(null)}
      />

      <Modal
        opened={!!deletingTable}
        onClose={() => setDeletingTable(null)}
        title="Excluir mesa"
        centered
      >
        <DeleteTableLogicComponent
          logicData={deleteTableLogicData}
          tableName={deletingTable?.name || 'Mesa sem nome'}
          onCancel={() => setDeletingTable(null)}
        />
      </Modal>
    </main>
  );
}
