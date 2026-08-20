import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Title } from "../api/types";
import SiteNav from "./SiteNav";

export default function Catalog() {
  const [titles, setTitles] = useState<Title[]>([]);

  useEffect(() => {
    api.listTitles().then(setTitles);
  }, []);

  return (
    <div>
      <SiteNav />
      <div style={{ padding: "40px 6vw", fontFamily: "var(--body-font)" }}>
      <h1 style={{ fontFamily: "var(--display-font)", fontSize: 36, letterSpacing: "0.03em", marginBottom: 28 }}>
        Каталог
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 20,
        }}
      >
        {titles.map((t) => (
          <Link
            key={t.id}
            to={`/title/${t.id}`}
            style={{ color: "var(--text)", textDecoration: "none" }}
          >
            <div
              style={{
                aspectRatio: "2/3",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--panel-solid)",
                border: "1px solid var(--line)",
                marginBottom: 8,
              }}
            >
              {t.posterUrlMobile && (
                <img src={t.posterUrlMobile} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
          </Link>
        ))}
        {titles.length === 0 && (
          <div style={{ color: "var(--text-dim)" }}>
            Тайтлов пока нет — добавь их через <Link to="/admin" style={{ color: "var(--accent)" }}>админку</Link>.
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
