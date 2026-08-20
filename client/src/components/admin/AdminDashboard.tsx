import { useState } from "react";
import TitlesList from "./TitlesList";
import TitleEditorModal from "./TitleEditorModal";
import ResourceManager from "./ResourceManager";
import SiteNav from "../SiteNav";
import "./admin.css";

export default function AdminDashboard() {
  const [view, setView] = useState<"titles" | "studios">("titles");
  const [editorState, setEditorState] = useState<{ titleId: number | null } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="admin-root">
      <SiteNav />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, padding: "12px 32px 0" }}>
        <button className="admin-btn-text" onClick={() => setView("titles")}>
          Тайтлы
        </button>
        <button className="admin-btn-text" onClick={() => setView("studios")}>
          Студии озвучки
        </button>
      </div>

      {view === "titles" && (
        <TitlesList
          key={reloadKey}
          onAdd={() => setEditorState({ titleId: null })}
          onEdit={(id) => setEditorState({ titleId: id })}
        />
      )}

      {view === "studios" && (
        <div style={{ padding: 32 }}>
          <ResourceManager
            resource="studios"
            title="Студии озвучки"
            fields={[
              { key: "name", label: "Название студии", type: "text" },
              { key: "logoUrl", label: "Логотип (URL)", type: "url" },
            ]}
            rowLabel={(r) => r.name}
          />
        </div>
      )}

      {editorState && (
        <TitleEditorModal
          titleId={editorState.titleId}
          onClose={() => setEditorState(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
