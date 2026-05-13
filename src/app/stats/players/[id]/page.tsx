import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computePlayerDetailedStats } from "@/lib/playerStats";

export default async function PlayerStatsDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [player, matches] = await Promise.all([
    prisma.player.findUnique({ where: { id } }),
    prisma.match.findMany({
      include: {
        callUps: {
          select: {
            playerId: true,
            status: true,
          },
        },
        events: {
          select: {
            minute: true,
            type: true,
            playerId: true,
            assistId: true,
            subOutId: true,
          },
        },
      },
    }),
  ]);

  if (!player) notFound();

  const stats = computePlayerDetailedStats(player, matches);

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/stats" className="back-button">
          ← Statistiche
        </Link>
        <h1>{player.lastName}</h1>
        <div style={{ width: "60px" }} />
      </header>

      <section className="list-section" style={{ display: "grid", gap: "1rem" }}>
        <article className="modern-form" style={{ gap: "0.75rem" }}>
          <h2 style={{ fontSize: "1.25rem" }}>
            {player.lastName} {player.firstName}
          </h2>
          <p className="text-muted">Riepilogo stagionale</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <strong>Gol:</strong> {stats.goals}
            </div>
            <div>
              <strong>Assist:</strong> {stats.assists}
            </div>
            <div>
              <strong>Partite:</strong> {stats.matchesPlayed}
            </div>
            <div>
              <strong>Minuti:</strong> {stats.minutesPlayed}
            </div>
            <div>
              <strong>Gialli:</strong> {stats.yellowCards}
            </div>
            <div>
              <strong>Rossi:</strong> {stats.redCardsDirect + stats.redCardsSecondYellow}</div>
          </div>
        </article>

        <h3 style={{ marginTop: "0.5rem" }}>Dettaglio per partita</h3>

        {stats.matches.length === 0 ? (
          <p className="text-muted">Nessun dato disponibile per questo giocatore.</p>
        ) : (
          <ul className="item-list">
            {stats.matches.map((item) => (
              <li key={item.matchId} className="list-item" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>vs {item.opponent}</div>
                    <div className="item-subtitle">
                      {new Date(item.date).toLocaleDateString("it-IT")} • {item.location === "HOME" ? "Casa" : "Trasferta"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: "128px" }}>
                    <div>
                      <strong>{item.minutesPlayed}'</strong>
                    </div>
                    <div className="item-subtitle">{item.started ? "Titolare" : "Subentrato"}</div>
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <span>⚽ {item.goals}</span>
                  <span>🅰️ {item.assists}</span>
                  <span>🟨 {item.yellowCards}</span>
                  <span>🟥 dir. {item.redCardsDirect}</span>
                  <span>🟥 2g. {item.redCardsSecondYellow}</span>
                  <span>
                    {item.enteredAt !== null ? `IN ${item.enteredAt}'` : "IN -"} / {item.leftAt !== null ? `OUT ${item.leftAt}'` : "OUT -"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
