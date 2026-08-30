'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/libs/i18n';
import { mantineTheme } from '@/libs/mantine/mantine-theme';
import { useState } from 'react';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

// Tema custom aplicado aqui (redesign visual — ver `.claude/rules/table-concept.md`
// seção 6): `mantineTheme` vem de `libs/mantine/mantine-theme.ts`, montado a
// partir dos tokens de UI de `shared/constants/colors.ts` (PRIMARY/SECONDARY/
// TERTIARY/ACCENT) e das fontes de `libs/fonts.ts`. `forceColorScheme="dark"`
// trava o tema sempre escuro (decisão do redesign: seguir
// `~/personal/contosecantosvilgard`, que não tem alternância clara/escura) —
// substitui o `defaultColorScheme="auto"` anterior, que seguia a preferência
// do SO.
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  }));

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider
          theme={mantineTheme}
          forceColorScheme="dark"
        >
          <Notifications position="top-right" />

          {children}
        </MantineProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
