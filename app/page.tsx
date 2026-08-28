'use client';

import Link from 'next/link';
import { Button, Text, Title } from '@mantine/core';
import { Icon } from '@iconify/react';

// Home: só um portal de entrada (uso pessoal, um único dono, sem contas de
// usuário — ver `.claude/rules/table-concept.md`). Um único botão leva pra
// `/mesas`, a lista de todas as mesas já criadas.
export default function Home() {
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
            Gerencie suas mesas de RPG.
          </Text>

          {divider}

          <Button
            component={Link}
            href="/mesas"
            leftSection={(
              <Icon icon="lucide:scroll" />
            )}
            fullWidth
            className="uppercase tracking-[0.08em]"
          >
            Iniciar
          </Button>

          <Text className="mt-6 text-[0.65rem] uppercase tracking-[0.15em] text-gold/40">
            Sua mesa, suas fichas, sua lenda
          </Text>
        </div>

        {runeBand}
      </div>
    </main>
  );
}
