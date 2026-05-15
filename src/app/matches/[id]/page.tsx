import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MatchEventsActions from "./MatchEventsActions";
import DeleteEventButton from "./DeleteEventButton";
import { getCurrentUserPermissions } from "@/lib/authServer";
import { getGoalTypeLabel } from "@/lib/goalTypes";

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, canWrite } = await getCurrentUserPermissions();

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true,
      roster: {
        select: { ownerId: true },
      },
      events: {
        include: {
          player: true,
          assist: true,
          subOut: true,
        },
        orderBy: { minute: 'desc' }
      },
      callUps: {
        include: { player: true }
      }
    }
  });

  if (!match) return <div className="page-container"><p>Partita non trovata</p></div>;

  const canAccessMatch =
    user?.role === "ADMIN" ||
    match.roster.ownerId === null ||
    (user?.id && match.roster.ownerId === user.id);

  if (!canAccessMatch) {
    return <div className="page-container"><p>Partita non trovata</p></div>;
  }

  const ourGoals = match.events.filter((event) => event.type === "GOAL").length;
  const opponentGoals = match.events.filter((event) => event.type === "OPPONENT_GOAL").length;
  const leftTeamGoals = match.location === "HOME" ? ourGoals : opponentGoals;
  const rightTeamGoals = match.location === "HOME" ? opponentGoals : ourGoals;
  const selectablePlayers = match.callUps
    .filter((callUp) => callUp.status !== "NOT_CALLED")
    .map((callUp) => callUp.player);
  const starterIds = match.callUps
    .filter((callUp) => callUp.status === "STARTER")
    .map((callUp) => callUp.playerId);
  const benchIds = match.callUps
    .filter((callUp) => callUp.status === "BENCH")
    .map((callUp) => callUp.playerId);
  const substitutions = [...match.events]
    .filter((event) => event.type === "SUBSTITUTION")
    .sort((a, b) => a.minute - b.minute)
    .map((event) => ({
      minute: event.minute,
      playerId: event.playerId,
      subOutId: event.subOutId,
    }));

  return (
    <main className="page-container">
      <header className="page-header" style={{ background: 'var(--primary)', color: 'white' }}>
        <Link href="/matches" style={{ color: 'white', textDecoration: 'none' }}>← Indietro</Link>
        <h1 style={{ color: 'white' }}>Live Match</h1>
        <div style={{ width: '60px' }}></div>
      </header>

      <section className="match-scoreboard" style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{match.location === 'HOME' ? 'Noi' : match.opponent}</h2>
            <span style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)' }}>{leftTeamGoals}</span>
          </div>
          <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>-</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{match.location === 'AWAY' ? 'Noi' : match.opponent}</h2>
            <span style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)' }}>{rightTeamGoals}</span>
          </div>
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{new Date(match.date).toLocaleDateString("it-IT")}</p>
      </section>

      <section style={{ padding: '1rem' }}>
        {canWrite ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Link href={`/matches/${match.id}/callups`} className="primary-action-button" style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--primary)', textDecoration: 'none' }}>
              📋 Gestisci Convocazioni
            </Link>
          </div>
        ) : null}

        <MatchEventsActions
          matchId={match.id}
          players={selectablePlayers}
          canWrite={canWrite}
          starterIds={starterIds}
          benchIds={benchIds}
          substitutions={substitutions}
        />

        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Cronaca (Eventi)</h3>
        {match.events.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center' }}>Nessun evento registrato.</p>
        ) : (
          <ul className="item-list">
            {match.events.map(event => (
              <li key={event.id} className="list-item" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--primary)', width: '40px' }}>{event.minute}'</div>
                <div>
                  {event.type === 'GOAL' && (
                    <span>
                      ⚽ Gol di <strong>{event.player?.lastName || 'Giocatore'}</strong>
                      {getGoalTypeLabel(event.goalType) ? (
                        <>
                          {' '}
                          (<strong>{getGoalTypeLabel(event.goalType)}</strong>)
                        </>
                      ) : null}
                      {event.assist ? (
                        <>
                          {' '}
                          (assist: <strong>{event.assist.lastName}</strong>)
                        </>
                      ) : null}
                    </span>
                  )}
                  {event.type === 'SUBSTITUTION' && (
                    <span>
                      🔄 Entra <strong>{event.player?.lastName || 'Giocatore'}</strong>
                      {' '}per <strong>{event.subOut?.lastName || 'Giocatore'}</strong>
                    </span>
                  )}
                  {event.type === 'YELLOW_CARD' && <span>🟨 Giallo a <strong>{event.player?.lastName || 'Giocatore'}</strong></span>}
                  {event.type === 'RED_CARD_DIRECT' && <span>🟥 Rosso diretto a <strong>{event.player?.lastName || 'Giocatore'}</strong></span>}
                  {event.type === 'RED_CARD_SECOND_YELLOW' && <span>🟥 Doppio giallo a <strong>{event.player?.lastName || 'Giocatore'}</strong></span>}
                  {event.type === 'OPPONENT_GOAL' && <span>🎯 Gol avversario</span>}
                </div>
                <DeleteEventButton matchId={match.id} eventId={event.id} canWrite={canWrite} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
