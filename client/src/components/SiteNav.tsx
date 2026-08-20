import { Link, useLocation } from "react-router-dom";
import { logout } from "./auth/AuthGate";

export default function SiteNav() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 32px",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <Link
        to="/"
        style={{
          padding: "7px 14px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          color: isAdmin ? "var(--text-dim)" : "var(--accent)",
          border: "1px solid var(--line)",
          background: isAdmin ? "transparent" : "var(--accent-soft)",
        }}
      >
        Каталог
      </Link>
      <Link
        to="/admin"
        style={{
          padding: "7px 14px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          color: isAdmin ? "var(--accent)" : "var(--text-dim)",
          border: "1px solid var(--line)",
          background: isAdmin ? "var(--accent-soft)" : "transparent",
        }}
      >
        Админка
      </Link>
      <div style={{ flex: 1 }} />
      <button
        onClick={logout}
        style={{ fontSize: 12, color: "var(--text-dim)", padding: "7px 10px" }}
      >
        Выйти
      </button>
    </div>
  );
}
