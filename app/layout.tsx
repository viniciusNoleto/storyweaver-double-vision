import type { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import { fontAccent, fontBody, fontDisplay } from '@/libs/fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Storyweaver',
  description: 'Gerenciador de mesa de RPG para o Mestre administrar personagens e fichas em tempo real.',
};

// Variáveis de fonte (`--font-display`/`--font-body`/`--font-accent`) aplicadas
// no `<html>` para ficarem disponíveis em qualquer CSS/Tailwind/Mantine do
// projeto (globals.css, mantine-theme.ts, classes utilitárias `font-display`/
// `font-accent` do tailwind.config.mjs) — ver `libs/fonts.ts` e
// `.claude/rules/table-concept.md` seção 6.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`h-full antialiased ${fontDisplay.variable} ${fontBody.variable} ${fontAccent.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>

      <body className="min-h-screen flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
