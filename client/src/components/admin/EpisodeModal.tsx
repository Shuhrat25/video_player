import { useEffect, useState } from "react";
import { api, adminResource } from "../../api/client";
import type { VideoQuality } from "../../api/types";
import MediaUrlInput from "./MediaUrlInput";

interface EpisodeModalProps {
  seasonId: number;
  episodeId?: number;
  defaultNumber?: number;
  onClose: () => void;
  onSaved: () => void;
}

interface SourceRow {
  quality: VideoQuality;
  url: string;
  fileName?: string;
}

interface SubtitleRow {
  language: string;
  url: string;
}

function secondsToText(s: number | null | undefined) {
  if (s == null) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function textToSeconds(t: string): number | undefined {
  if (!t.trim()) return undefined;
  const parts = t.split(":").map((p) => Number(p.trim()));
  if (parts.some((p) => Number.isNaN(p))) return undefined;
  if (parts.length === 1) return parts[0];
  return parts[0] * 60 + parts[1];
}

export default function EpisodeModal({ seasonId, episodeId, defaultNumber, onClose, onSaved }: EpisodeModalProps) {
  const [number, setNumber] = useState(defaultNumber ? String(defaultNumber) : "");
  const [name, setName] = useState("");
  const [poster, setPoster] = useState("");
  const [sources, setSources] = useState<SourceRow[]>([{ quality: "720p", url: "" }]);
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>([]);
  const [openingStart, setOpeningStart] = useState("");
  const [openingEnd, setOpeningEnd] = useState("");
  const [endingStart, setEndingStart] = useState("");
  const [endingEnd, setEndingEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!episodeId) return;
    api.getEpisode(episodeId).then((ep) => {
      setNumber(String(ep.number));
      setName(ep.name || "");
      setPoster(ep.posterUrl || "");
      setSources(ep.sources.length ? ep.sources.map((s) => ({ quality: s.quality, url: s.url })) : [{ quality: "720p", url: "" }]);
      setSubtitles(ep.subtitles.map((s) => ({ language: s.language, url: s.url })));
      setOpeningStart(secondsToText(ep.openingStart));
      setOpeningEnd(secondsToText(ep.openingEnd));
      setEndingStart(secondsToText(ep.endingStart));
      setEndingEnd(secondsToText(ep.endingEnd));
    });
  }, [episodeId]);

  function updateSource(i: number, patch: Partial<SourceRow>) {
    setSources((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function handleSourceFile(i: number, file: File | null) {
    if (!file) return;
    updateSource(i, { url: URL.createObjectURL(file), fileName: file.name });
  }

  function updateSubtitle(i: number, patch: Partial<SubtitleRow>) {
    setSubtitles((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  async function handleSave() {
    setError(null);
    if (!number.trim()) return setError("Укажи номер серии");
    if (!poster.trim()) return setError("Загрузи обложку серии");
    const validSources = sources.filter((s) => s.url.trim());
    if (validSources.length === 0) return setError("Добавь хотя бы один источник видео");

    setSaving(true);
    try {
      const payload = {
        seasonId,
        number: Number(number),
        name: name || undefined,
        posterUrl: poster,
        openingStart: textToSeconds(openingStart),
        openingEnd: textToSeconds(openingEnd),
        endingStart: textToSeconds(endingStart),
        endingEnd: textToSeconds(endingEnd),
      };

      let epId = episodeId;
      if (epId) {
        await adminResource("episodes").update(epId, payload);
        const existing = await api.getEpisode(epId);
        await Promise.all(existing.sources.map((s) => adminResource("video-sources").remove(s.id)));
        await Promise.all(existing.subtitles.map((s) => adminResource("subtitles").remove(s.id)));
      } else {
        const created = await adminResource<{ id: number }>("episodes").create(payload);
        epId = created.id;
      }

      await Promise.all(
        validSources.map((s) =>
          adminResource("video-sources").create({ episodeId: epId, quality: s.quality, url: s.url })
        )
      );
      await Promise.all(
        subtitles
          .filter((s) => s.language.trim() && s.url.trim())
          .map((s) => adminResource("subtitles").create({ episodeId: epId, language: s.language, url: s.url }))
      );

      onSaved();
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения серии");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{episodeId ? "Редактирование серии" : "Новая серия"}</span>
          <button onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <div className="field-grid">
            <div>
              <label className="field-label">Номер серии</label>
              <input className="field-input" type="number" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Название серии (необязательно)</label>
              <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="field-label">Источники видео</label>
            {sources.map((s, i) => (
              <div className="repeat-row" key={i}>
                <div>
                  <input
                    className="field-input"
                    placeholder="Ссылка на видео"
                    value={s.url}
                    onChange={(e) => updateSource(i, { url: e.target.value, fileName: undefined })}
                  />
                </div>
                <div style={{ flex: "0 0 110px" }}>
                  <select
                    className="field-select"
                    value={s.quality}
                    onChange={(e) => updateSource(i, { quality: e.target.value as VideoQuality })}
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                <label className="admin-btn-secondary" style={{ flex: "0 0 auto", cursor: "pointer" }}>
                  Файл
                  <input
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleSourceFile(i, e.target.files?.[0] || null)}
                  />
                </label>
                {sources.length > 1 && (
                  <button className="repeat-row-remove" onClick={() => setSources(sources.filter((_, idx) => idx !== i))}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            ))}
            <button className="admin-btn-secondary" onClick={() => setSources([...sources, { quality: "720p", url: "" }])}>
              + Добавить источник
            </button>
          </div>

          <div>
            <label className="field-label">Субтитры (необязательно)</label>
            {subtitles.map((s, i) => (
              <div className="repeat-row" key={i}>
                <div style={{ flex: "0 0 140px" }}>
                  <input
                    className="field-input"
                    placeholder="Язык"
                    value={s.language}
                    onChange={(e) => updateSubtitle(i, { language: e.target.value })}
                  />
                </div>
                <div>
                  <input
                    className="field-input"
                    placeholder="Ссылка на .vtt"
                    value={s.url}
                    onChange={(e) => updateSubtitle(i, { url: e.target.value })}
                  />
                </div>
                <button className="repeat-row-remove" onClick={() => setSubtitles(subtitles.filter((_, idx) => idx !== i))}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
            <button className="admin-btn-secondary" onClick={() => setSubtitles([...subtitles, { language: "", url: "" }])}>
              + Добавить субтитры
            </button>
          </div>

          <div className="field-grid">
            <div>
              <label className="field-label">Опенинг — начало (мм:сс)</label>
              <input className="field-input" placeholder="1:30" value={openingStart} onChange={(e) => setOpeningStart(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Опенинг — конец (мм:сс)</label>
              <input className="field-input" placeholder="3:00" value={openingEnd} onChange={(e) => setOpeningEnd(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Эндинг — начало (мм:сс)</label>
              <input className="field-input" placeholder="21:40" value={endingStart} onChange={(e) => setEndingStart(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Эндинг — конец (мм:сс)</label>
              <input className="field-input" placeholder="23:00" value={endingEnd} onChange={(e) => setEndingEnd(e.target.value)} />
            </div>
          </div>

          <MediaUrlInput label="Обложка серии (превью перед воспроизведением)" value={poster} onChange={setPoster} aspect="16/9" />

          {error && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</div>}

          <button className="admin-btn-primary" style={{ alignSelf: "flex-start" }} onClick={handleSave} disabled={saving}>
            {saving ? "Сохраняем..." : "Сохранить серию"}
          </button>
        </div>
      </div>
    </div>
  );
}
