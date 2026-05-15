"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ACTIVE_ROSTER_COOKIE } from "@/lib/activeRoster";
import { USER_ROLE_LABELS_IT } from "@/lib/userRoles";

type MenuItem = {
  href: string;
  label: string;
};

type RosterItem = {
  id: string;
  name: string;
};

type CurrentUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: keyof typeof USER_ROLE_LABELS_IT;
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const canWrite = currentUser?.role === "ADMIN" || currentUser?.role === "EDITOR";
  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    if (pathname === "/login") {
      setLoadingUser(false);
      return;
    }

    const cookieValue = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${ACTIVE_ROSTER_COOKIE}=`))
      ?.split("=")[1];

    if (cookieValue) {
      setActiveRosterId(decodeURIComponent(cookieValue));
    }

    Promise.all([
      fetch("/api/auth/me").then((res) => (res.ok ? res.json() : Promise.reject(new Error("unauthorized")))),
      fetch("/api/rosters").then((res) => (res.ok ? res.json() : Promise.reject(new Error("rosters error")))),
    ])
      .then(([me, rosterList]) => {
        setCurrentUser(me.user as CurrentUser);
        const data = rosterList as RosterItem[];
        setRosters(data);

        if (!cookieValue && data.length > 0) {
          const firstRosterId = data[0].id;
          document.cookie = `${ACTIVE_ROSTER_COOKIE}=${encodeURIComponent(firstRosterId)}; path=/; max-age=31536000; SameSite=Lax`;
          setActiveRosterId(firstRosterId);
          router.refresh();
        }
      })
      .catch(() => {
        setCurrentUser(null);
        if (pathname !== "/login") {
          router.push("/login");
        }
      })
      .finally(() => setLoadingUser(false));
  }, [pathname, router]);

  const setActiveRoster = (rosterId: string) => {
    document.cookie = `${ACTIVE_ROSTER_COOKIE}=${encodeURIComponent(rosterId)}; path=/; max-age=31536000; SameSite=Lax`;
    setActiveRosterId(rosterId);
    router.refresh();
  };

  const handleCreateRoster = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canWrite) return;

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setCurrentUser(null);
    router.push("/login");
    router.refresh();
  };

  if (pathname === "/login") {
    return null;
  }

  if (loadingUser) {
    return null;
  }

  return (
    <div className="top-menu-wrap">
      {currentUser ? (
        <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <strong>{currentUser.lastName} {currentUser.firstName}</strong>
            <span className="item-subtitle">{USER_ROLE_LABELS_IT[currentUser.role]}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {isAdmin ? (
              <Link href="/admin/users" className="back-button">
                Admin
              </Link>
            ) : null}
            <button type="button" className="back-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      ) : null}

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
            disabled={!canWrite}
          />
          <button type="submit" className="primary-action-button" disabled={!canWrite}>+ Crea</button>
        </form>
      </div>
    </div>
  );
}
