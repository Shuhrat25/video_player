import { useState } from "react";

interface MediaUrlInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: string; // css aspect-ratio, напр. "2/3" для постера, "16/9" для кадра
}

export default function MediaUrlInput({ label, value, onChange, aspect = "16/9" }: MediaUrlInputProps) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div style={{ width: "100%" }}>
      <label style={{ display: "block", fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>
        {label}
      </label>
      <div
        style={{
          aspectRatio: aspect,
          borderRadius: 10,
          border: "1px dashed var(--line)",
          background: "#00000066",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
          position: "relative",
        }}
      >
        {(preview || value) ? (
          <img src={preview || value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <i className="fa-solid fa-image" style={{ color: "var(--text-dim)", fontSize: 22 }} />
        )}
        <label
          style={{
            position: "absolute",
            bottom: 6,
            right: 6,
            padding: "4px 8px",
            borderRadius: 6,
            background: "#000000b3",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          Выбрать файл
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>
      <input
        type="text"
        placeholder="Ссылка на изображение (URL)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "7px 10px",
          borderRadius: 6,
          border: "1px solid var(--line)",
          background: "#00000066",
          color: "var(--text)",
          fontSize: 12,
        }}
      />
    </div>
  );
}
