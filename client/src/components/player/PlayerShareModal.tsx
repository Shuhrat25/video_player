import { useState } from "react";

interface PlayerShareModalProps {
  baseWatchUrl: string;
  baseEmbedUrl: string;
  currentTime: number;
  onClose: () => void;
}

export default function PlayerShareModal({
  baseWatchUrl,
  baseEmbedUrl,
  currentTime,
  onClose,
}: PlayerShareModalProps) {
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const t = Math.floor(currentTime);
  const watchUrl = includeTimestamp ? `${baseWatchUrl}?t=${t}` : baseWatchUrl;
  const embedUrl = includeTimestamp ? `${baseEmbedUrl}?t=${t}` : baseEmbedUrl;
  const embedCode = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(watchUrl)}`;

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  async function downloadQr() {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr-code.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, "_blank");
    }
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
          <div className="share-timestamp-toggle">
            <span>Добавить текущий момент видео ({Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")})</span>
            <span
              className={"toggle-switch" + (includeTimestamp ? " on" : "")}
              onClick={() => setIncludeTimestamp((v) => !v)}
              style={{ cursor: "pointer" }}
            >
              <span className="toggle-switch__knob" />
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>
              Обычная ссылка
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={watchUrl} style={shareInput} />
              <button style={copyBtn} onClick={() => copy(watchUrl, "watch")}>
                {copied === "watch" ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>
              Embed-код
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={embedCode} style={shareInput} />
              <button style={copyBtn} onClick={() => copy(embedCode, "embed")}>
                {copied === "embed" ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </div>

          <div className="share-qr" onClick={downloadQr} title="Нажми, чтобы скачать QR-код">
            <img src={qrUrl} alt="QR-код" width={140} height={140} />
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Скачать QR-код</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
