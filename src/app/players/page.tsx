import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Server Component to fetch players
export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { lastName: 'asc' },
  });

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>La Rosa</h1>
        <Link href="/players/new" className="primary-action-button">+ Aggiungi</Link>
      </header>

      <section className="list-section">
        {players.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>Nessun giocatore in rosa.</p>
            <p className="text-sm text-muted">Aggiungi il tuo primo giocatore!</p>
          </div>
        ) : (
          <ul className="item-list">
            {players.map((player) => (
              <li key={player.id} className="list-item">
                <Link href={`/players/${player.id}`} className="list-item-link">
                  <div className="item-avatar">
                    {player.number ? player.number : "?"}
                  </div>
                  <div className="item-details">
                    <h3 className="item-title">{player.lastName} {player.firstName}</h3>
                    <span className="item-subtitle">{player.role}</span>
                  </div>
                  <div className="item-chevron">›</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
