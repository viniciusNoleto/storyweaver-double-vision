import type { Metadata } from 'next';
import { fontBody, fontDisplay } from '@/libs/fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Storyweaver',
  description: 'Gerenciador de mesa de RPG para o Mestre administrar personagens e fichas em tempo real.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontBody.variable}`}
    >
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
