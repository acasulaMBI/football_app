"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PlayerStatsItem = {
  playerId: string;
  firstName: string;
  lastName: string;
  goals: number;
  minutesPlayed: number;
  matchesPlayed: number;
};

type SortField = "goals" | "minutesPlayed" | "matchesPlayed" | "lastName";
type SortDirection = "asc" | "desc";
type FilterMode = "ALL" | "PLAYED_MATCHES" | "HAS_GOALS";

interface StatsListClientProps {
  initialStats: PlayerStatsItem[];
}

export default function StatsListClient({ initialStats }: StatsListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [sortField, setSortField] = useState<SortField>("goals");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredAndSorted = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase("it-IT");

    const filtered = initialStats.filter((item) => {
      const fullName = `${item.lastName} ${item.firstName}`.toLocaleLowerCase("it-IT");
      const matchesSearch = !normalizedSearch || fullName.includes(normalizedSearch);

      if (!matchesSearch) return false;
      if (filterMode === "PLAYED_MATCHES") return item.matchesPlayed > 0;
      if (filterMode === "HAS_GOALS") return item.goals > 0;

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "lastName") {
        const base = a.lastName.localeCompare(b.lastName, "it-IT");
        return sortDirection === "asc" ? base : -base;
      }

      const base = a[sortField] - b[sortField];
      if (base !== 0) {
        return sortDirection === "asc" ? base : -base;
      }

      return a.lastName.localeCompare(b.lastName, "it-IT");
    });

    return sorted;
  }, [initialStats, searchText, filterMode, sortField, sortDirection]);

  return (
    <>
      <div className="modern-form" style={{ marginBottom: "1rem", gap: "0.75rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Cerca giocatore"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select
          className="form-input"
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as FilterMode)}
        >
          <option value="ALL">Tutti i giocatori</option>
          <option value="PLAYED_MATCHES">Solo con presenze</option>
          <option value="HAS_GOALS">Solo con almeno un gol</option>
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <select
            className="form-input"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            <option value="goals">Ordina per gol</option>
            <option value="minutesPlayed">Ordina per minuti</option>
            <option value="matchesPlayed">Ordina per partite</option>
            <option value="lastName">Ordina per cognome</option>
          </select>

          <select
            className="form-input"
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as SortDirection)}
          >
            <option value="desc">Decrescente</option>
            <option value="asc">Crescente</option>
          </select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📉</div>
          <p>Nessun giocatore trovato con i filtri selezionati.</p>
        </div>
      ) : (
        <ul className="item-list">
          {filteredAndSorted.map((item) => (
            <li key={item.playerId} className="list-item">
              <Link href={`/stats/players/${item.playerId}`} className="list-item-link">
                <div className="item-avatar" style={{ background: "var(--secondary)" }}>
                  {item.goals}
                </div>
                <div className="item-details">
                  <h3 className="item-title">
                    {item.lastName} {item.firstName}
                  </h3>
                  <span className="item-subtitle">
                    Gol: {item.goals} • Minuti: {item.minutesPlayed} • Partite: {item.matchesPlayed}
                  </span>
                </div>
                <div className="item-chevron">›</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
