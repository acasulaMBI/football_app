import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";

export default async function TournamentsPage() {
  const activeRosterId = await getActiveRosterIdFromCookies();
  const tournaments = activeRosterId
    ? await prisma.tournament.findMany({
        where: { rosterId: activeRosterId },
        orderBy: { createdAt: 'desc' },
        include: {
          matches: {
            orderBy: { date: "asc" },
          },
        },
      })
    : [];

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>Tornei</h1>
        <Link href="/tournaments/new" className="primary-action-button">+ Nuovo</Link>
      </header>

      <section className="list-section">
        {!activeRosterId ? (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <p>Seleziona prima una rosa attiva dal menu in alto.</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p>Nessun torneo creato.</p>
          </div>
        ) : (
          <ul className="item-list">
            {tournaments.map((t) => (
              <li key={t.id} className="list-item">
                <Link href={`/tournaments/${t.id}`} className="list-item-link">
                  <div className="item-avatar" style={{ backgroundColor: 'var(--warning)' }}>
                    T
                  </div>
                  <div className="item-details" style={{ width: "100%" }}>
                    <h3 className="item-title">{t.name}</h3>
                    <span className="item-subtitle">
                      Stagione {t.season} • {t.matches.length} {t.matches.length === 1 ? "partita" : "partite"}
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
