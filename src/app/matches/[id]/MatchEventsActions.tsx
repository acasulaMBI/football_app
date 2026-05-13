"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface SelectablePlayer {
  id: string;
  firstName: string;
  lastName: string;
}

interface MatchEventsActionsProps {
  matchId: string;
  players: SelectablePlayer[];
  starterIds: string[];
  benchIds: string[];
  substitutions: Array<{ minute: number; playerId: string | null; subOutId: string | null }>;
}

type ActionType =
  | "GOAL"
  | "SUBSTITUTION"
  | "OPPONENT_GOAL"
  | "YELLOW_CARD"
  | "RED_CARD";

export default function MatchEventsActions({
  matchId,
  players,
  starterIds,
  benchIds,
  substitutions,
}: MatchEventsActionsProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [goalMinute, setGoalMinute] = useState("");
  const [goalPlayerId, setGoalPlayerId] = useState("");
  const [goalAssistId, setGoalAssistId] = useState("");

  const [subMinute, setSubMinute] = useState("");
  const [subInId, setSubInId] = useState("");
  const [subOutId, setSubOutId] = useState("");

  const [opponentGoalMinute, setOpponentGoalMinute] = useState("");

  const [yellowMinute, setYellowMinute] = useState("");
  const [yellowPlayerId, setYellowPlayerId] = useState("");

  const [redMinute, setRedMinute] = useState("");
  const [redPlayerId, setRedPlayerId] = useState("");
  const [redType, setRedType] = useState<"RED_CARD_DIRECT" | "RED_CARD_SECOND_YELLOW">(
    "RED_CARD_DIRECT"
  );

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.lastName.localeCompare(b.lastName, "it-IT")),
    [players]
  );

  const resetForms = () => {
    setGoalMinute("");
    setGoalPlayerId("");
    setGoalAssistId("");
    setSubMinute("");
    setSubInId("");
    setSubOutId("");
    setOpponentGoalMinute("");
    setYellowMinute("");
    setYellowPlayerId("");
    setRedMinute("");
    setRedPlayerId("");
    setRedType("RED_CARD_DIRECT");
  };

  const activePlayerIds = useMemo(() => {
    const current = new Set(starterIds);

    for (const substitution of substitutions) {
      if (substitution.subOutId) {
        current.delete(substitution.subOutId);
      }

      if (substitution.playerId) {
        current.add(substitution.playerId);
      }
    }

    return current;
  }, [starterIds, substitutions]);

  const postEvent = async (payload: Record<string, string>) => {
    const response = await fetch(`/api/matches/${matchId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Errore nel salvataggio dell'evento");
    }
  };

  const handleGoalSubmit = async () => {
    if (!goalMinute || !goalPlayerId) {
      alert("Inserisci minuto e marcatore.");
      return;
    }

    setIsSaving(true);
    try {
      await postEvent({
        minute: goalMinute,
        type: "GOAL",
        playerId: goalPlayerId,
        assistId: goalAssistId,
      });
      resetForms();
      setActiveAction(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante il salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubSubmit = async () => {
    if (!subMinute || !subInId || !subOutId) {
      alert("Inserisci minuto, chi entra e chi esce.");
      return;
    }

    if (subInId === subOutId) {
      alert("Il giocatore in entrata deve essere diverso da quello in uscita.");
      return;
    }

    if (!benchIds.includes(subInId)) {
      alert("Chi entra deve essere un giocatore in panchina.");
      return;
    }

    if (!activePlayerIds.has(subOutId)) {
      alert("Chi esce deve essere attualmente in campo.");
      return;
    }

    if (activePlayerIds.has(subInId)) {
      alert("Il giocatore in entrata risulta gia in campo.");
      return;
    }

    setIsSaving(true);
    try {
      await postEvent({
        minute: subMinute,
        type: "SUBSTITUTION",
        playerId: subInId,
        subOutId,
      });
      resetForms();
      setActiveAction(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante il salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpponentGoalSubmit = async () => {
    if (!opponentGoalMinute) {
      alert("Inserisci il minuto del gol avversario.");
      return;
    }

    setIsSaving(true);
    try {
      await postEvent({ minute: opponentGoalMinute, type: "OPPONENT_GOAL" });
      resetForms();
      setActiveAction(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante il salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleYellowSubmit = async () => {
    if (!yellowMinute || !yellowPlayerId) {
      alert("Inserisci minuto e giocatore ammonito.");
      return;
    }

    setIsSaving(true);
    try {
      await postEvent({ minute: yellowMinute, type: "YELLOW_CARD", playerId: yellowPlayerId });
      resetForms();
      setActiveAction(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante il salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRedSubmit = async () => {
    if (!redMinute || !redPlayerId) {
      alert("Inserisci minuto e giocatore espulso.");
      return;
    }

    setIsSaving(true);
    try {
      await postEvent({ minute: redMinute, type: redType, playerId: redPlayerId });
      resetForms();
      setActiveAction(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante il salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          className="primary-action-button"
          style={{
            padding: "1rem",
            fontSize: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: activeAction && activeAction !== "GOAL" ? 0.8 : 1,
          }}
          onClick={() => setActiveAction((prev) => (prev === "GOAL" ? null : "GOAL"))}
        >
          <span style={{ fontSize: "2rem" }}>⚽</span>
          Gol
        </button>

        <button
          type="button"
          className="primary-action-button"
          style={{
            background: "var(--warning)",
            padding: "1rem",
            fontSize: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: activeAction && activeAction !== "SUBSTITUTION" ? 0.8 : 1,
          }}
          onClick={() => setActiveAction((prev) => (prev === "SUBSTITUTION" ? null : "SUBSTITUTION"))}
        >
          <span style={{ fontSize: "2rem" }}>🔄</span>
          Cambio
        </button>

        <button
          type="button"
          className="primary-action-button"
          style={{
            background: "var(--danger)",
            padding: "1rem",
            fontSize: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: activeAction && activeAction !== "OPPONENT_GOAL" ? 0.8 : 1,
          }}
          onClick={() => setActiveAction((prev) => (prev === "OPPONENT_GOAL" ? null : "OPPONENT_GOAL"))}
        >
          <span style={{ fontSize: "2rem" }}>🎯</span>
          Gol avv.
        </button>

        <button
          type="button"
          className="primary-action-button"
          style={{
            background: "#facc15",
            color: "#1f2937",
            padding: "0.75rem",
            fontSize: "0.9rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: activeAction && activeAction !== "YELLOW_CARD" ? 0.8 : 1,
          }}
          onClick={() => setActiveAction((prev) => (prev === "YELLOW_CARD" ? null : "YELLOW_CARD"))}
        >
          <span style={{ fontSize: "1.5rem" }}>🟨</span>
          Giallo
        </button>

        <button
          type="button"
          className="primary-action-button"
          style={{
            background: "#dc2626",
            color: "white",
            padding: "0.75rem",
            fontSize: "0.9rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: activeAction && activeAction !== "RED_CARD" ? 0.8 : 1,
          }}
          onClick={() => setActiveAction((prev) => (prev === "RED_CARD" ? null : "RED_CARD"))}
        >
          <span style={{ fontSize: "1.5rem" }}>🟥</span>
          Espuls.
        </button>
      </div>

      {activeAction === "GOAL" && (
        <div className="modern-form" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <input
              type="number"
              min={0}
              max={130}
              className="form-input"
              placeholder="Minuto"
              value={goalMinute}
              onChange={(e) => setGoalMinute(e.target.value)}
            />
            <select
              className="form-input"
              value={goalPlayerId}
              onChange={(e) => setGoalPlayerId(e.target.value)}
            >
              <option value="">Seleziona marcatore</option>
              {sortedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.lastName} {player.firstName}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              value={goalAssistId}
              onChange={(e) => setGoalAssistId(e.target.value)}
            >
              <option value="">Assist (opzionale)</option>
              {sortedPlayers
                .filter((player) => player.id !== goalPlayerId)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.lastName} {player.firstName}
                  </option>
                ))}
            </select>
            <button type="button" className="submit-button" onClick={handleGoalSubmit} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva gol"}
            </button>
          </div>
        </div>
      )}

      {activeAction === "SUBSTITUTION" && (
        <div className="modern-form" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <input
              type="number"
              min={0}
              max={130}
              className="form-input"
              placeholder="Minuto"
              value={subMinute}
              onChange={(e) => setSubMinute(e.target.value)}
            />
            <select className="form-input" value={subInId} onChange={(e) => setSubInId(e.target.value)}>
              <option value="">Chi entra</option>
              {sortedPlayers.filter((player) => benchIds.includes(player.id)).map((player) => (
                <option key={player.id} value={player.id}>
                  {player.lastName} {player.firstName}
                </option>
              ))}
            </select>
            <select className="form-input" value={subOutId} onChange={(e) => setSubOutId(e.target.value)}>
              <option value="">Chi esce</option>
              {sortedPlayers.filter((player) => activePlayerIds.has(player.id)).map((player) => (
                <option key={player.id} value={player.id}>
                  {player.lastName} {player.firstName}
                </option>
              ))}
            </select>
            <button type="button" className="submit-button" onClick={handleSubSubmit} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva cambio"}
            </button>
          </div>
        </div>
      )}

      {activeAction === "OPPONENT_GOAL" && (
        <div className="modern-form" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <input
              type="number"
              min={0}
              max={130}
              className="form-input"
              placeholder="Minuto gol avversario"
              value={opponentGoalMinute}
              onChange={(e) => setOpponentGoalMinute(e.target.value)}
            />
            <button
              type="button"
              className="submit-button"
              style={{ background: "var(--danger)" }}
              onClick={handleOpponentGoalSubmit}
              disabled={isSaving}
            >
              {isSaving ? "Salvataggio..." : "Salva gol avversario"}
            </button>
          </div>
        </div>
      )}

      {activeAction === "YELLOW_CARD" && (
        <div className="modern-form" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <input
              type="number"
              min={0}
              max={130}
              className="form-input"
              placeholder="Minuto"
              value={yellowMinute}
              onChange={(e) => setYellowMinute(e.target.value)}
            />
            <select
              className="form-input"
              value={yellowPlayerId}
              onChange={(e) => setYellowPlayerId(e.target.value)}
            >
              <option value="">Giocatore ammonito</option>
              {sortedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.lastName} {player.firstName}
                </option>
              ))}
            </select>
            <button type="button" className="submit-button" onClick={handleYellowSubmit} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva ammonizione"}
            </button>
          </div>
        </div>
      )}

      {activeAction === "RED_CARD" && (
        <div className="modern-form" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <input
              type="number"
              min={0}
              max={130}
              className="form-input"
              placeholder="Minuto"
              value={redMinute}
              onChange={(e) => setRedMinute(e.target.value)}
            />
            <select className="form-input" value={redPlayerId} onChange={(e) => setRedPlayerId(e.target.value)}>
              <option value="">Giocatore espulso</option>
              {sortedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.lastName} {player.firstName}
                </option>
              ))}
            </select>
            <select className="form-input" value={redType} onChange={(e) => setRedType(e.target.value as "RED_CARD_DIRECT" | "RED_CARD_SECOND_YELLOW")}>
              <option value="RED_CARD_DIRECT">Rosso diretto</option>
              <option value="RED_CARD_SECOND_YELLOW">Doppio giallo</option>
            </select>
            <button
              type="button"
              className="submit-button"
              style={{ background: "var(--danger)" }}
              onClick={handleRedSubmit}
              disabled={isSaving}
            >
              {isSaving ? "Salvataggio..." : "Salva espulsione"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}