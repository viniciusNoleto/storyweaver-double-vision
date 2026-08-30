import Link from 'next/link';
import { ShieldChevron, Play } from '@phosphor-icons/react/dist/ssr';

export default function HomePage() {
  return (
    <div className="home-screen">
      <div className="home-glow" />

      <div className="home-content fade">
        <ShieldChevron
          weight="fill"
          size={46}
          color="var(--gold)"
        />

        <h1>Contos e Cantos de Vilgard</h1>

        <p style={{ fontSize: 15, color: 'var(--text-faint)', fontStyle: 'italic', margin: '-6px 0 0' }}>
          Onde a Esperança e o Medo decidem o destino dos aventureiros.
        </p>

        <Link
          href="/mesas"
          className="btn btn-primary"
          style={{ padding: '14px 30px', fontSize: 14 }}
        >
          <Play weight="bold" />
          Iniciar
        </Link>
      </div>
    </div>
  );
}
