import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activeRosterId = await getActiveRosterIdFromCookies();

  if (!activeRosterId) {
    notFound();
  }

  const tournament = await prisma.tournament.findFirst({
    where: { id, rosterId: activeRosterId },
    include: {
      matches: {
        orderBy: { date: "asc" },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/tournaments" className="back-button">← Tornei</Link>
        <h1>{tournament.name}</h1>
        <div style={{ width: "60px" }}></div>
      </header>

      <section className="list-section">
        <div style={{ marginBottom: "1rem" }}>
          <p className="item-subtitle">Stagione {tournament.season}</p>
          <p className="item-subtitle">
            {tournament.matches.length} {tournament.matches.length === 1 ? "partita associata" : "partite associate"}
          </p>
        </div>

        {tournament.matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚽</div>
            <p>Nessuna partita associata a questo torneo.</p>
          </div>
        ) : (
          <ul className="item-list">
            {tournament.matches.map((match) => (
              <li key={match.id} className="list-item">
                <Link href={`/matches/${match.id}`} className="list-item-link">
                  <div
                    className="item-avatar"
                    style={{
                      backgroundColor:
                        match.location === "HOME" ? "var(--primary)" : "var(--warning)",
                    }}
                  >
                    {match.location === "HOME" ? "C" : "T"}
                  </div>
                  <div className="item-details">
                    <h3 className="item-title">vs {match.opponent}</h3>
                    <span className="item-subtitle">
                      {new Date(match.date).toLocaleDateString("it-IT")}
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
