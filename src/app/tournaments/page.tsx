import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      matches: {
        orderBy: { date: "asc" },
      },
    },
  });

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>Tornei</h1>
        <Link href="/tournaments/new" className="primary-action-button">+ Nuovo</Link>
      </header>

      <section className="list-section">
        {tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p>Nessun torneo creato.</p>
          </div>
        ) : (
          <ul className="item-list">
            {tournaments.map((t) => (
              <li key={t.id} className="list-item" style={{ padding: "1rem" }}>
                <div className="list-item-link" style={{ padding: 0, alignItems: "flex-start" }}>
                  <div className="item-avatar" style={{ backgroundColor: 'var(--warning)' }}>
                    T
                  </div>
                  <div className="item-details" style={{ width: "100%" }}>
                    <h3 className="item-title">{t.name}</h3>
                    <span className="item-subtitle">Stagione {t.season}</span>

                    <div style={{ marginTop: "0.75rem" }}>
                      {t.matches.length === 0 ? (
                        <p className="text-muted text-sm">Nessuna partita associata a questo torneo.</p>
                      ) : (
                        <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {t.matches.map((match) => (
                            <li key={match.id}>
                              <Link href={`/matches/${match.id}`} style={{ color: "var(--secondary)", fontWeight: 500 }}>
                                {new Date(match.date).toLocaleDateString("it-IT")} - vs {match.opponent}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
