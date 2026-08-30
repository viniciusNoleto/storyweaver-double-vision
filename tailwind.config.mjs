import {
  VG_BG, VG_BG2, VG_BG3, VG_GOLD, VG_GOLD_LIGHT, VG_GOLD_DIM,
  VG_MAROON, VG_MAROON_LIGHT, VG_TEXT, VG_TEXT_DIM, VG_TEXT_FAINT,
  VG_BORDER, VG_MANA_BLUE,
} from './libs/vilgard-colors';

export default {
  theme: {
    extend: {
      colors: {
        'vg-bg': VG_BG,
        'vg-bg2': VG_BG2,
        'vg-bg3': VG_BG3,
        'vg-gold': VG_GOLD,
        'vg-gold-light': VG_GOLD_LIGHT,
        'vg-gold-dim': VG_GOLD_DIM,
        'vg-maroon': VG_MAROON,
        'vg-maroon-light': VG_MAROON_LIGHT,
        'vg-text': VG_TEXT,
        'vg-text-dim': VG_TEXT_DIM,
        'vg-text-faint': VG_TEXT_FAINT,
        'vg-border': VG_BORDER,
        'vg-mana': VG_MANA_BLUE,
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'serif'],
      },
    },
  },
};
