import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computePlayerSummary, computeRosterCumulativeStats } from "@/lib/playerStats";
import StatsListClient from "./StatsListClient";
import { getCurrentUserPermissions } from "@/lib/authServer";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ tournamentId?: string }>;
}) {
  await getCurrentUserPermissions();
  const { tournamentId = "" } = await searchParams;

  const whereTournament =
    tournamentId === ""
      ? {}
      : tournamentId === "friendly"
        ? { tournamentId: null }
        : { tournamentId };

  const rosters = await prisma.roster.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const rosterIds = rosters.map((roster) => roster.id);

  const [players, matches, tournaments] = await Promise.all([
    prisma.player.findMany({ orderBy: { lastName: "asc" } }),
    prisma.match.findMany({
      where: {
        ...whereTournament,
        rosterId: {
          in: rosterIds.length > 0 ? rosterIds : ["__none__"],
        },
      },
      include: {
        roster: {
          select: {
            id: true,
            name: true,
          },
        },
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
    prisma.tournament.findMany({
      where: {
        rosterId: {
          in: rosterIds.length > 0 ? rosterIds : ["__none__"],
        },
      },
      orderBy: [{ season: "desc" }, { name: "asc" }],
      select: { id: true, name: true, season: true },
    }),
  ]);

  const playersWithStats = players
    .map((player) => computePlayerSummary(player, matches))
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.minutesPlayed !== a.minutesPlayed) return b.minutesPlayed - a.minutesPlayed;
      return a.lastName.localeCompare(b.lastName, "it-IT");
    });

  const perRosterStats = rosters.map((roster) => {
    const rosterMatches = matches.filter((match) => match.rosterId === roster.id);
    const playersStats = players
      .map((player) => computePlayerSummary(player, rosterMatches))
      .sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.minutesPlayed !== a.minutesPlayed) return b.minutesPlayed - a.minutesPlayed;
        return a.lastName.localeCompare(b.lastName, "it-IT");
      });

    return {
      rosterId: roster.id,
      rosterName: roster.name,
      players: playersStats,
    };
  });

  const rosterCumulativeStats = computeRosterCumulativeStats(matches);

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
        <form method="GET" className="modern-form" style={{ marginBottom: "1rem", gap: "0.75rem" }}>
          <label htmlFor="tournamentId">Filtra partite per torneo</label>
          <select id="tournamentId" name="tournamentId" className="form-input" defaultValue={tournamentId}>
            <option value="">Tutti i tornei</option>
            <option value="friendly">Solo amichevoli</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name} ({tournament.season})
              </option>
            ))}
          </select>
          <button type="submit" className="primary-action-button">Applica filtro</button>
        </form>

        {playersWithStats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>Nessun giocatore disponibile.</p>
          </div>
        ) : (
          <StatsListClient
            initialGlobalStats={playersWithStats}
            perRosterStats={perRosterStats}
            rosterCumulativeStats={rosterCumulativeStats}
          />
        )}
      </section>
    </main>
  );
}
