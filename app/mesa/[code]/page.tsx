'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button, Stack, Text, Title } from '@mantine/core';

// Landing da Mesa para quem só tem o código/link, sem saber se é Mestre ou
// jogador. Puramente navegação — não busca dados da Mesa (a Tela do Mestre é
// responsável por pedir `?key=` quando não há cookie válido).
//
// Client Component: `<Button component={Link}>` do Mantine precisa de um
// Client Component ao redor (`component` recebe uma função, que não pode
// cruzar a fronteira Server→Client). Mesmo padrão de `use(params)` já usado
// em `app/mesa/[code]/{mestre,exibicao}/page.tsx`.
export default function TableLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const tableCode = code.toUpperCase();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md overflow-hidden rounded border-2 border-gold/40 bg-black/30 px-8 py-10 text-center">
        <Stack
          gap="lg"
          className="items-center"
        >
          <div>
            <Title
              order={1}
              c="primary.5"
              className="uppercase tracking-[0.1em] [text-shadow:0_0_20px_rgba(201,168,76,0.35)]"
            >
              {`Mesa ${tableCode}`}
            </Title>

            <Text className="text-parchment/65">
              Como você quer entrar nesta mesa?
            </Text>
          </div>

          <Stack
            gap="sm"
            className="w-full"
          >
            <Button
              component={Link}
              href={`/mesa/${tableCode}/mestre`}
              fullWidth
              className="uppercase tracking-[0.06em]"
            >
              Entrar como Mestre
            </Button>

            <Button
              component={Link}
              href={`/mesa/${tableCode}/exibicao`}
              variant="outline"
              fullWidth
              className="uppercase tracking-[0.06em]"
            >
              Abrir Tela de Exibição
            </Button>
          </Stack>
        </Stack>
      </div>
    </main>
  );
}
