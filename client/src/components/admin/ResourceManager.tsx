import { useEffect, useState } from "react";
import { adminResource } from "../../api/client";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "url" | "select";
  options?: { value: string | number; label: string }[];
}

interface ResourceManagerProps {
  resource: string;
  title: string;
  fields: FieldConfig[];
  rowLabel: (row: any) => string;
}

export default function ResourceManager({ resource, title, fields, rowLabel }: ResourceManagerProps) {
  const client = adminResource<any>(resource);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setRows(await client.list());
  }

  useEffect(() => {
    reload();
    setForm({});
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  function toPayload(): Record<string, any> {
    const payload: Record<string, any> = {};
    for (const f of fields) {
      const raw = form[f.key];
      if (raw === undefined || raw === "") continue;
      payload[f.key] = f.type === "number" || f.type === "select" ? Number(raw) : raw;
    }
    return payload;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await client.update(editingId, toPayload());
      } else {
        await client.create(toPayload());
      }
      setForm({});
      setEditingId(null);
      reload();
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения");
    }
  }

  function startEdit(row: any) {
    setEditingId(row.id);
    const next: Record<string, string> = {};
    for (const f of fields) next[f.key] = row[f.key] ?? "";
    setForm(next);
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить запись?")) return;
    await client.remove(id);
    reload();
  }

  return (
    <div>
      <h2 style={{ fontFamily: "var(--display-font)", fontSize: 24, marginBottom: 16 }}>{title}</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {fields.map((f) => (
          <div key={f.key} style={{ minWidth: 160 }}>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-dim)", marginBottom: 3 }}>
              {f.label}
            </label>
            {f.type === "select" ? (
              <select
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                style={fieldStyle}
              >
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                style={fieldStyle}
              />
            )}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <button type="submit" style={primaryBtn}>
            {editingId ? "Сохранить" : "Добавить"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({});
              }}
              style={secondaryBtn}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {error && <div style={{ color: "#ff6b6b", marginBottom: 12, fontSize: 13 }}>{error}</div>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--text-dim)", borderBottom: "1px solid var(--line)" }}>
            <th style={{ padding: "8px 6px" }}>ID</th>
            <th style={{ padding: "8px 6px" }}>Запись</th>
            <th style={{ padding: "8px 6px", width: 140 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "8px 6px", fontFamily: "var(--mono-font)" }}>{row.id}</td>
              <td style={{ padding: "8px 6px" }}>{rowLabel(row)}</td>
              <td style={{ padding: "8px 6px", display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(row)} style={secondaryBtn}>
                  Изменить
                </button>
                <button onClick={() => handleDelete(row.id)} style={dangerBtn}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 16, color: "var(--text-dim)" }}>
                Пока пусто
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "#00000066",
  color: "var(--text)",
  fontSize: 13,
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 6,
  background: "var(--accent)",
  color: "#14171e",
  fontWeight: 700,
  fontSize: 13,
};

const secondaryBtn: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 6,
  border: "1px solid var(--line)",
  fontSize: 12,
};

const dangerBtn: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 6,
  border: "1px solid #ff6b6b55",
  color: "#ff6b6b",
  fontSize: 12,
};
