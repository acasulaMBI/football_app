"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ACTIVE_ROSTER_COOKIE } from "@/lib/activeRoster";

type MenuItem = {
  href: string;
  label: string;
};

type RosterItem = {
  id: string;
  name: string;
};

const items: MenuItem[] = [
  { href: "/", label: "Home" },
  { href: "/rosters", label: "Rose" },
  { href: "/players", label: "Rosa" },
  { href: "/matches", label: "Partite" },
  { href: "/tournaments", label: "Tornei" },
  { href: "/stats", label: "Statistiche" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TopMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [rosters, setRosters] = useState<RosterItem[]>([]);
  const [activeRosterId, setActiveRosterId] = useState("");
  const [newRosterName, setNewRosterName] = useState("");

  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${ACTIVE_ROSTER_COOKIE}=`))
      ?.split("=")[1];

    if (cookieValue) {
      setActiveRosterId(decodeURIComponent(cookieValue));
    }

    fetch("/api/rosters")
      .then((res) => res.json())
      .then((data: RosterItem[]) => {
        setRosters(data);
        if (!cookieValue && data.length > 0) {
          const firstRosterId = data[0].id;
          document.cookie = `${ACTIVE_ROSTER_COOKIE}=${encodeURIComponent(firstRosterId)}; path=/; max-age=31536000; SameSite=Lax`;
          setActiveRosterId(firstRosterId);
          router.refresh();
        }
      })
      .catch((error) => console.error("Failed to load rosters", error));
  }, [router]);

  const setActiveRoster = (rosterId: string) => {
    document.cookie = `${ACTIVE_ROSTER_COOKIE}=${encodeURIComponent(rosterId)}; path=/; max-age=31536000; SameSite=Lax`;
    setActiveRosterId(rosterId);
    router.refresh();
  };

  const handleCreateRoster = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newRosterName.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/rosters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        alert("Errore durante la creazione della rosa.");
        return;
      }

      const createdRoster: RosterItem = await res.json();
      setRosters((prev) => [...prev, createdRoster].sort((a, b) => a.name.localeCompare(b.name, "it-IT")));
      setNewRosterName("");
      setActiveRoster(createdRoster.id);
    } catch (error) {
      console.error(error);
      alert("Errore di rete.");
    }
  };

  return (
    <div className="top-menu-wrap">
      <nav className="top-menu" aria-label="Menu principale">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`top-menu-link${active ? " top-menu-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="top-menu-roster">
        <label htmlFor="active-roster" className="top-menu-roster-label">Rosa attiva</label>
        <select
          id="active-roster"
          className="form-input"
          value={activeRosterId}
          onChange={(e) => setActiveRoster(e.target.value)}
        >
          <option value="">Seleziona una rosa</option>
          {rosters.map((roster) => (
            <option key={roster.id} value={roster.id}>
              {roster.name}
            </option>
          ))}
        </select>

        <form onSubmit={handleCreateRoster} className="top-menu-roster-form">
          <input
            type="text"
            className="form-input"
            placeholder="Nuova rosa"
            value={newRosterName}
            onChange={(e) => setNewRosterName(e.target.value)}
          />
          <button type="submit" className="primary-action-button">+ Crea</button>
        </form>
      </div>
    </div>
  );
}
