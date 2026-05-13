import Link from 'next/link';

export default function Home() {
  return (
    <main className="dashboard">
      <header className="header-glass">
        <h1>Football Team Manager</h1>
        <p>Gestisci la tua squadra, organizza le partite e traccia le statistiche.</p>
      </header>

      <section className="menu-grid">
        <Link href="/players" className="menu-card players-card">
          <div className="card-icon">👥</div>
          <h2>La Rosa</h2>
          <p>Gestisci i giocatori e le statistiche</p>
        </Link>

        <Link href="/matches" className="menu-card matches-card">
          <div className="card-icon">⚽</div>
          <h2>Partite</h2>
          <p>Calendario, convocazioni ed eventi live</p>
        </Link>

        <Link href="/tournaments" className="menu-card tournaments-card">
          <div className="card-icon">🏆</div>
          <h2>Tornei</h2>
          <p>Competizioni e stagioni in corso</p>
        </Link>

        <Link href="/stats" className="menu-card" style={{ borderLeft: "4px solid #ef4444" }}>
          <div className="card-icon">📊</div>
          <h2>Statistiche</h2>
          <p>Gol, minuti e presenze con dettaglio per giocatore</p>
        </Link>
      </section>
    </main>
  );
}
