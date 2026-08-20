import { useState } from "react";

interface ShareModalProps {
  watchUrl: string;
  embedUrl: string;
  onClose: () => void;
}

export default function ShareModal({ watchUrl, embedUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const embedCode = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Поделиться</span>
          <button onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={shareLabel}>Обычная ссылка</label>
            <div style={shareRow}>
              <input readOnly value={watchUrl} style={shareInput} />
              <button style={copyBtn} onClick={() => copy(watchUrl, "watch")}>
                {copied === "watch" ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </div>

          <div>
            <label style={shareLabel}>Embed-код (для встраивания)</label>
            <div style={shareRow}>
              <input readOnly value={embedCode} style={shareInput} />
              <button style={copyBtn} onClick={() => copy(embedCode, "embed")}>
                {copied === "embed" ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const shareLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--text-dim)",
  marginBottom: 6,
};

const shareRow: React.CSSProperties = { display: "flex", gap: 8 };

const shareInput: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "#00000066",
  color: "var(--text)",
  fontSize: 12,
  minWidth: 0,
};

const copyBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  background: "var(--accent)",
  color: "#14171e",
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: "nowrap",
};
