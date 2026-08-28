'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  CopyButton,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icon } from '@iconify/react';
import { createTableService, CreateTableServiceResponse } from '@/resources/table/services/createTable';

export default function Home() {
  const [tableName, setTableName] = useState('');
  const [createdTable, setCreatedTable] = useState<CreateTableServiceResponse | null>(null);

  const {
    isPending: createTableIsPending,
    mutate: createTableMutate,
  } = useMutation({
    mutationFn: () => createTableService({ body: { name: tableName.trim() || undefined } }),
    onSuccess: ({ data }) => {
      setCreatedTable(data);
    },
    onError: () => {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível criar a mesa. Tente novamente.',
        color: 'red',
      });
    },
  });

  function createTable() {
    createTableMutate();
  }

  function createAnotherTable() {
    setCreatedTable(null);
    setTableName('');
  }

  const runeBand = (
    <div className="border-y border-gold/20 px-4 py-[0.4rem] text-center text-[0.6rem] tracking-[0.3em] text-gold/30 overflow-hidden whitespace-nowrap">
      ✦ STORYWEAVER ✦ MESTRE E JOGADORES ✦ STORYWEAVER ✦ MESTRE E JOGADORES ✦
    </div>
  );

  const divider = (
    <div className="my-1 flex items-center justify-center gap-3">
      <span className="h-px max-w-20 flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <span className="text-lg text-gold">
        ✦
      </span>

      <span className="h-px max-w-20 flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
    </div>
  );

  if (createdTable) {
    const masterLink = `/mesa/${createdTable.code}/mestre?key=${createdTable.master_key}`;
    const displayLink = `/mesa/${createdTable.code}/exibicao`;

    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl overflow-hidden rounded border-2 border-gold/40 bg-black/30">
          {runeBand}

          <div className="px-6 py-8 sm:px-10">
            <Stack gap="lg">
              <div className="text-center">
                <Title
                  order={2}
                  c="primary.5"
                  className="uppercase tracking-[0.1em] [text-shadow:0_0_20px_rgba(201,168,76,0.35)]"
                >
                  Mesa Forjada
                </Title>

                <Text className="mt-1 text-parchment/65">
                  Código da mesa:{' '}
                  <Text
                    span
                    fw={700}
                    className="font-accent tracking-wide text-gold-light"
                  >
                    {createdTable.code}
                  </Text>
                </Text>
              </div>

              {divider}

              <Alert
                color="secondary"
                variant="outline"
                title="Guarde esta chave agora"
                icon={(
                  <Icon icon="lucide:triangle-alert" />
                )}
              >
                O link do Mestre abaixo só aparece nesta tela, uma única vez. Copie e salve em um
                lugar seguro — se você perder este link, não será possível recuperar o acesso de
                Mestre desta mesa.
              </Alert>

              <Card padding="lg">
                <Stack gap="xs">
                  <Text
                    size="sm"
                    className="font-display uppercase tracking-[0.06em] text-gold/70"
                  >
                    Link do Mestre
                  </Text>

                  <Text
                    size="xs"
                    className="text-parchment/50"
                  >
                    Controla a mesa e edita fichas.
                  </Text>

                  <Group
                    gap="xs"
                    wrap="nowrap"
                  >
                    <TextInput
                      readOnly
                      value={masterLink}
                      className="flex-1"
                      onFocus={(e) => e.currentTarget.select()}
                    />

                    <CopyButton value={masterLink}>
                      {({ copied, copy }) => (
                        <Button
                          type="button"
                          color={copied ? 'teal' : 'primary'}
                          onClick={copy}
                        >
                          {copied ? 'Copiado!' : 'Copiar'}
                        </Button>
                      )}
                    </CopyButton>
                  </Group>

                  <Button
                    component={Link}
                    href={masterLink}
                    target="_blank"
                    variant="light"
                  >
                    Abrir Tela do Mestre
                  </Button>
                </Stack>
              </Card>

              <Card padding="lg">
                <Stack gap="xs">
                  <Text
                    size="sm"
                    className="font-display uppercase tracking-[0.06em] text-gold/70"
                  >
                    Link de Exibição
                  </Text>

                  <Text
                    size="xs"
                    className="text-parchment/50"
                  >
                    Público, só leitura — abra num telão/TV.
                  </Text>

                  <Group
                    gap="xs"
                    wrap="nowrap"
                  >
                    <TextInput
                      readOnly
                      value={displayLink}
                      className="flex-1"
                      onFocus={(e) => e.currentTarget.select()}
                    />

                    <CopyButton value={displayLink}>
                      {({ copied, copy }) => (
                        <Button
                          type="button"
                          color={copied ? 'teal' : 'primary'}
                          onClick={copy}
                        >
                          {copied ? 'Copiado!' : 'Copiar'}
                        </Button>
                      )}
                    </CopyButton>
                  </Group>

                  <Button
                    component={Link}
                    href={displayLink}
                    target="_blank"
                    variant="light"
                  >
                    Abrir Tela de Exibição
                  </Button>
                </Stack>
              </Card>

              <Button
                type="button"
                variant="subtle"
                color="gray"
                onClick={createAnotherTable}
              >
                Criar outra mesa
              </Button>
            </Stack>
          </div>

          {runeBand}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-[560px] overflow-hidden rounded border-2 border-gold/40 bg-black/30">
        {runeBand}

        <div className="px-8 py-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(201,168,76,0.4)] bg-[radial-gradient(circle,rgba(201,168,76,0.12),transparent_70%)] text-gold animate-pulse-glow">
              <Icon
                icon="lucide:scroll-text"
                width={36}
                height={36}
              />
            </div>
          </div>

          <Title
            order={1}
            c="primary.5"
            className="text-[2.1rem] uppercase tracking-[0.12em] [text-shadow:0_0_24px_rgba(201,168,76,0.5)]"
          >
            Storyweaver
          </Title>

          <Text className="mt-2 text-[0.95rem] italic leading-relaxed text-parchment/70">
            Gerencie sua mesa de RPG. Crie uma sessão e compartilhe os links com seu grupo.
          </Text>

          {divider}

          <Stack
            gap="md"
            className="text-left"
          >
            <TextInput
              label="Nome da mesa (opcional)"
              placeholder="Ex.: A Maldição de Strahd"
              value={tableName}
              onChange={(e) => setTableName(e.currentTarget.value)}
            />

            <Button
              type="button"
              loading={createTableIsPending}
              disabled={createTableIsPending}
              onClick={createTable}
              leftSection={(
                <Icon icon="lucide:dices" />
              )}
              fullWidth
              className="uppercase tracking-[0.08em]"
            >
              Criar Mesa
            </Button>
          </Stack>

          <Text className="mt-6 text-[0.65rem] uppercase tracking-[0.15em] text-gold/40">
            Sua mesa, suas fichas, sua lenda
          </Text>
        </div>

        {runeBand}
      </div>
    </main>
  );
}
