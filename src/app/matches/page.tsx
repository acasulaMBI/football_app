import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";

export default async function MatchesPage() {
  const activeRosterId = await getActiveRosterIdFromCookies();
  const matches = activeRosterId
    ? await prisma.match.findMany({
        where: { rosterId: activeRosterId },
        orderBy: { date: 'asc' },
        include: { tournament: true }
      })
    : [];

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>Partite</h1>
        <Link href="/matches/new" className="primary-action-button">+ Nuova</Link>
      </header>

      <section className="list-section">
        {!activeRosterId ? (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <p>Seleziona prima una rosa attiva dal menu in alto.</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚽</div>
            <p>Nessuna partita in programma.</p>
          </div>
        ) : (
          <ul className="item-list">
            {matches.map((match) => (
              <li key={match.id} className="list-item">
                <Link href={`/matches/${match.id}`} className="list-item-link">
                  <div className="item-avatar" style={{ backgroundColor: match.location === 'HOME' ? 'var(--primary)' : 'var(--warning)' }}>
                    {match.location === 'HOME' ? 'C' : 'T'}
                  </div>
                  <div className="item-details">
                    <h3 className="item-title">vs {match.opponent}</h3>
                    <span className="item-subtitle">
                      {new Date(match.date).toLocaleDateString("it-IT")} • {match.tournament?.name || "Amichevole"}
                    </span>
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
