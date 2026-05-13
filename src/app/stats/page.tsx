import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computePlayerSummary } from "@/lib/playerStats";
import StatsListClient from "./StatsListClient";

export default async function StatsPage() {
  const [players, matches] = await Promise.all([
    prisma.player.findMany({ orderBy: { lastName: "asc" } }),
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

  const playersWithStats = players
    .map((player) => computePlayerSummary(player, matches))
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.minutesPlayed !== a.minutesPlayed) return b.minutesPlayed - a.minutesPlayed;
      return a.lastName.localeCompare(b.lastName, "it-IT");
    });

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">
          ← Home
        </Link>
        <h1>Statistiche</h1>
        <div style={{ width: "60px" }} />
      </header>

      <section className="list-section">
        {playersWithStats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>Nessun giocatore disponibile.</p>
          </div>
        ) : (
          <StatsListClient initialStats={playersWithStats} />
        )}
      </section>
    </main>
  );
}
