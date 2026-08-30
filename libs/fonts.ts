import { Cinzel, EB_Garamond } from 'next/font/google';

// Fontes do canvas Storyweaver.dc.html (linha 12): Cinzel para headings,
// EB Garamond para corpo. Self-hosted via next/font, expostas como CSS custom
// properties aplicadas em <html> por app/layout.tsx.
export const fontDisplay = Cinzel({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const fontBody = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});
