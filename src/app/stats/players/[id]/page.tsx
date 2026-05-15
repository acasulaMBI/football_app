import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  computePlayerDetailedStats,
  computePlayerDetailedStatsByRoster,
} from "@/lib/playerStats";
import { getCurrentUserPermissions } from "@/lib/authServer";

export default async function PlayerStatsDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tournamentId?: string }>;
}) {
  const { id } = await params;
  const { user } = await getCurrentUserPermissions();
  const { tournamentId = "" } = await searchParams;

  const whereTournament =
    tournamentId === ""
      ? {}
      : tournamentId === "friendly"
        ? { tournamentId: null }
        : { tournamentId };

  const rosters = await prisma.roster.findMany({
    where:
      user?.role === "ADMIN"
        ? undefined
        : {
            OR: [{ ownerId: user?.id || "" }, { ownerId: null }],
          },
    select: { id: true },
  });

  const rosterIds = rosters.map((roster) => roster.id);

  const [player, matches, tournaments] = await Promise.all([
    prisma.player.findUnique({ where: { id } }),
    prisma.match.findMany({
      where: {
        ...whereTournament,
        ...(user?.role === "ADMIN"
          ? {}
          : {
              rosterId: {
                in: rosterIds.length > 0 ? rosterIds : ["__none__"],
              },
            }),
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
      where:
        user?.role === "ADMIN"
          ? undefined
          : {
              rosterId: {
                in: rosterIds.length > 0 ? rosterIds : ["__none__"],
              },
            },
      orderBy: [{ season: "desc" }, { name: "asc" }],
      select: { id: true, name: true, season: true },
    }),
  ]);

  if (!player) notFound();

  const stats = computePlayerDetailedStats(player, matches);
  const perRosterStats = computePlayerDetailedStatsByRoster(player, matches).filter(
    (item) => item.summary.matchesPlayed > 0 || item.summary.goals > 0 || item.summary.assists > 0
  );

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
        <form method="GET" className="modern-form" style={{ gap: "0.75rem" }}>
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

        <article className="modern-form" style={{ gap: "0.75rem" }}>
          <h2 style={{ fontSize: "1.25rem" }}>
            {player.lastName} {player.firstName}
          </h2>
          <p className="text-muted">Riepilogo cumulativo globale</p>
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
              <strong>Rossi:</strong> {stats.redCardsDirect + stats.redCardsSecondYellow}
            </div>
          </div>
        </article>

        {perRosterStats.length > 0 ? (
          <article className="modern-form" style={{ gap: "0.75rem" }}>
            <h3>Riepilogo per rosa</h3>
            <ul className="item-list">
              {perRosterStats.map((item) => (
                <li key={item.rosterId} className="list-item" style={{ padding: "0.85rem 1rem" }}>
                  <div style={{ fontWeight: 700 }}>{item.rosterName}</div>
                  <div className="item-subtitle">
                    Gol: {item.summary.goals} • Assist: {item.summary.assists} • Minuti: {item.summary.minutesPlayed} • Partite: {item.summary.matchesPlayed}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

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
