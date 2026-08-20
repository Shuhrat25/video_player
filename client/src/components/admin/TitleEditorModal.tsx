import { useEffect, useState } from "react";
import { api, adminResource } from "../../api/client";
import type { Title, Season, RelatedTitleEntry, EpisodeSummary } from "../../api/types";
import MediaUrlInput from "./MediaUrlInput";
import KebabMenu from "./KebabMenu";
import ShareModal from "./ShareModal";
import EpisodeModal from "./EpisodeModal";

interface TitleEditorModalProps {
  titleId: number | null;
  onClose: () => void;
  onSaved: () => void;
}

interface StudioOption {
  id: number;
  name: string;
}

export default function TitleEditorModal({ titleId, onClose, onSaved }: TitleEditorModalProps) {
  const [savedId, setSavedId] = useState<number | null>(titleId);

  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [year, setYear] = useState("");
  const [author, setAuthor] = useState("");
  const [genresText, setGenresText] = useState("");
  const [totalEpisodes, setTotalEpisodes] = useState("");
  const [description, setDescription] = useState("");
  const [posterMobile, setPosterMobile] = useState("");
  const [posterDesktop, setPosterDesktop] = useState("");

  const [nameSuggestions, setNameSuggestions] = useState<Title[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [related, setRelated] = useState<RelatedTitleEntry[]>([]);
  const [relatedQuery, setRelatedQuery] = useState("");
  const [relatedSuggestions, setRelatedSuggestions] = useState<Title[]>([]);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [studios, setStudios] = useState<StudioOption[]>([]);
  const [seasonNameDraft, setSeasonNameDraft] = useState("");
  const [seasonStudioDraft, setSeasonStudioDraft] = useState("");

  const [episodeModal, setEpisodeModal] = useState<{ mode: "create" | "edit"; episodeId?: number } | null>(
    null
  );
  const [shareInfo, setShareInfo] = useState<{ episodeId: number } | null>(null);

  useEffect(() => {
    adminResource<StudioOption>("studios").list().then(setStudios);
    if (titleId) loadFull(titleId);
  }, [titleId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFull(id: number) {
    const full = await api.getTitle(id);
    applyFullTitle(full);
  }

  function applyFullTitle(full: Title) {
    setSavedId(full.id);
    setName(full.name);
    setOriginalName(full.originalName || "");
    setYear(full.year ? String(full.year) : "");
    setAuthor(full.author || "");
    setGenresText((full.genres || []).join(", "));
    setTotalEpisodes(full.totalEpisodes ? String(full.totalEpisodes) : "");
    setDescription(full.description || "");
    setPosterMobile(full.posterUrlMobile || "");
    setPosterDesktop(full.posterUrlDesktop || "");
    setRelated(full.related);
    setSeasons(full.seasons);
    if (full.seasons[0]) setActiveSeasonId(full.seasons[0].id);
  }

  // ---- Автокомплит по названию (только пока тайтл ещё не выбран/создан) ----
  useEffect(() => {
    if (savedId || !name.trim()) {
      setNameSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setNameSuggestions(await api.search(name));
    }, 250);
    return () => clearTimeout(t);
  }, [name, savedId]);

  async function pickSuggestion(t: Title) {
    setShowSuggestions(false);
    await loadFull(t.id);
  }

  async function handleSaveBasics() {
    const payload = {
      name,
      originalName: originalName || undefined,
      year: year ? Number(year) : undefined,
      author: author || undefined,
      genres: genresText
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      totalEpisodes: totalEpisodes ? Number(totalEpisodes) : undefined,
      description: description || undefined,
      posterUrlMobile: posterMobile || undefined,
      posterUrlDesktop: posterDesktop || undefined,
    };

    if (savedId) {
      await adminResource("titles").update(savedId, payload);
    } else {
      const created = await adminResource<Title>("titles").create(payload);
      setSavedId(created.id);
    }
    onSaved();
  }

  // ---- Related ----
  useEffect(() => {
    if (!relatedQuery.trim()) {
      setRelatedSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await api.search(relatedQuery);
      setRelatedSuggestions(res.filter((r) => r.id !== savedId && !related.some((rt) => rt.relatedTitleId === r.id)));
    }, 250);
    return () => clearTimeout(t);
  }, [relatedQuery, related, savedId]);

  async function addRelated(t: Title) {
    if (!savedId) return;
    await adminResource("related-titles").create({
      titleId: savedId,
      relatedTitleId: t.id,
      position: related.length,
    });
    setRelatedQuery("");
    loadFull(savedId);
  }

  async function removeRelated(entry: RelatedTitleEntry) {
    await adminResource("related-titles").remove(entry.id);
    if (savedId) loadFull(savedId);
  }

  // ---- Seasons ----
  async function addSeason() {
    if (!savedId) return;
    const nextNumber = seasons.length ? Math.max(...seasons.map((s) => s.number)) + 1 : 1;
    const created = await adminResource<Season>("seasons").create({
      titleId: savedId,
      number: nextNumber,
      position: seasons.length,
    });
    await loadFull(savedId);
    setActiveSeasonId(created.id);
  }

  async function renameSeason(season: Season) {
    const newName = window.prompt("Название сезона (например, «Фильм»)", season.name || "");
    if (newName === null) return;
    await adminResource("seasons").update(season.id, { name: newName });
    if (savedId) loadFull(savedId);
  }

  function onSeasonDragStart(e: React.DragEvent, id: number) {
    e.dataTransfer.setData("text/season-id", String(id));
  }

  async function onSeasonDrop(e: React.DragEvent, targetId: number) {
    const draggedId = Number(e.dataTransfer.getData("text/season-id"));
    if (!draggedId || draggedId === targetId) return;
    const order = [...seasons];
    const from = order.findIndex((s) => s.id === draggedId);
    const to = order.findIndex((s) => s.id === targetId);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    setSeasons(order);
    await fetch("/api/admin/seasons/reorder", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify(order.map((s, i) => ({ id: s.id, position: i }))),
    });
  }

  const activeSeason = seasons.find((s) => s.id === activeSeasonId) || null;

  useEffect(() => {
    setSeasonNameDraft(activeSeason?.name || "");
    setSeasonStudioDraft(activeSeason?.studioId ? String(activeSeason.studioId) : "");
  }, [activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveSeasonSettings() {
    if (!activeSeason) return;
    await adminResource("seasons").update(activeSeason.id, {
      name: seasonNameDraft || undefined,
      studioId: seasonStudioDraft ? Number(seasonStudioDraft) : undefined,
    });
    if (savedId) loadFull(savedId);
  }

  async function deleteSeason(season: Season) {
    if (!confirm("Удалить сезон вместе со всеми сериями?")) return;
    await adminResource("seasons").remove(season.id);
    if (savedId) loadFull(savedId);
  }

  async function deleteEpisode(ep: EpisodeSummary) {
    if (!confirm("Удалить серию?")) return;
    await adminResource("episodes").remove(ep.id);
    if (savedId) loadFull(savedId);
  }

  const episodesSorted = activeSeason ? [...activeSeason.episodes].sort((a, b) => b.number - a.number) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{savedId ? "Редактирование тайтла" : "Новый тайтл"}</span>
          <button onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <div className="field-grid">
            <MediaUrlInput label="Постер (телефон)" value={posterMobile} onChange={setPosterMobile} aspect="2/3" />
            <MediaUrlInput label="Постер (ПК)" value={posterDesktop} onChange={setPosterDesktop} aspect="16/9" />
          </div>

          <div className="autocomplete">
            <label className="field-label">Название</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
                if (savedId) setSavedId(null); // начинаем поиск заново
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Введи название тайтла..."
            />
            {showSuggestions && !savedId && nameSuggestions.length > 0 && (
              <div className="autocomplete__list">
                {nameSuggestions.map((s) => (
                  <button key={s.id} className="autocomplete__item" onClick={() => pickSuggestion(s)}>
                    {s.posterUrlMobile && <img src={s.posterUrlMobile} alt="" />}
                    {s.name} {s.year ? `(${s.year})` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="field-grid">
            <div>
              <label className="field-label">Оригинальное название</label>
              <input className="field-input" value={originalName} onChange={(e) => setOriginalName(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Год выпуска</label>
              <input
                className="field-input"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Автор</label>
              <input className="field-input" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Жанры (через запятую)</label>
              <input className="field-input" value={genresText} onChange={(e) => setGenresText(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Всего эпизодов</label>
              <input
                className="field-input"
                type="number"
                value={totalEpisodes}
                onChange={(e) => setTotalEpisodes(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Описание</label>
            <textarea className="field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <button className="admin-btn-primary" style={{ alignSelf: "flex-start" }} onClick={handleSaveBasics}>
            {savedId ? "Сохранить изменения" : "Создать тайтл"}
          </button>

          {!savedId && (
            <div className="admin-btn-text">
              Сохрани основную информацию, чтобы добавить связанные тайтлы, сезоны и серии.
            </div>
          )}

          {savedId && (
            <>
              {/* ---- Related ---- */}
              <div>
                <label className="field-label">Связанное</label>
                <div className="autocomplete">
                  <input
                    className="field-input"
                    placeholder="Найти тайтл, чтобы связать..."
                    value={relatedQuery}
                    onChange={(e) => setRelatedQuery(e.target.value)}
                  />
                  {relatedSuggestions.length > 0 && (
                    <div className="autocomplete__list">
                      {relatedSuggestions.map((s) => (
                        <button key={s.id} className="autocomplete__item" onClick={() => addRelated(s)}>
                          {s.posterUrlMobile && <img src={s.posterUrlMobile} alt="" />}
                          {s.name} {s.year ? `(${s.year})` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="related-chip-list">
                  {related.map((r) => (
                    <div key={r.id} className="related-chip" onDoubleClick={() => removeRelated(r)} title="Двойной клик — удалить">
                      {r.posterUrlMobile && <img src={r.posterUrlMobile} alt="" />}
                      {r.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* ---- Seasons ---- */}
              <div>
                <label className="field-label">Сезоны</label>
                <div className="seasons-strip">
                  {seasons
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((s) => (
                      <div
                        key={s.id}
                        className={"season-chip" + (s.id === activeSeasonId ? " active" : "")}
                        draggable
                        onDragStart={(e) => onSeasonDragStart(e, s.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onSeasonDrop(e, s.id)}
                        onClick={() => setActiveSeasonId(s.id)}
                        onDoubleClick={() => renameSeason(s)}
                      >
                        {s.name || `Сезон ${s.number}`}
                      </div>
                    ))}
                  <button className="season-chip-add" onClick={addSeason}>
                    <i className="fa-solid fa-plus" />
                  </button>
                </div>

                {activeSeason && (
                  <div className="season-settings">
                    <div style={{ minWidth: 160 }}>
                      <label className="field-label">Название сезона</label>
                      <input
                        className="field-input"
                        value={seasonNameDraft}
                        onChange={(e) => setSeasonNameDraft(e.target.value)}
                      />
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <label className="field-label">Студия озвучки</label>
                      <select
                        className="field-select"
                        value={seasonStudioDraft}
                        onChange={(e) => setSeasonStudioDraft(e.target.value)}
                      >
                        <option value="">—</option>
                        {studios.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="admin-btn-secondary" onClick={saveSeasonSettings}>
                      Сохранить
                    </button>
                    <button className="admin-btn-text" onClick={() => deleteSeason(activeSeason)}>
                      Удалить сезон
                    </button>
                  </div>
                )}
              </div>

              {/* ---- Episodes ---- */}
              {activeSeason && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <label className="field-label" style={{ margin: 0 }}>
                      Серии — {activeSeason.name || `Сезон ${activeSeason.number}`}
                    </label>
                    <button
                      className="admin-btn-secondary"
                      onClick={() => setEpisodeModal({ mode: "create" })}
                    >
                      + Добавить серию
                    </button>
                  </div>

                  {episodesSorted.map((ep) => (
                    <div key={ep.id} className="episode-admin-row">
                      {ep.posterUrl ? (
                        <img className="episode-admin-row__poster" src={ep.posterUrl} alt="" />
                      ) : (
                        <div className="episode-admin-row__poster" />
                      )}
                      <div className="episode-admin-row__number">{ep.number}</div>
                      <div className="episode-admin-row__name">{ep.name || `Серия ${ep.number}`}</div>
                      <KebabMenu
                        onShare={() => setShareInfo({ episodeId: ep.id })}
                        onEdit={() => setEpisodeModal({ mode: "edit", episodeId: ep.id })}
                        onDelete={() => deleteEpisode(ep)}
                      />
                    </div>
                  ))}
                  {episodesSorted.length === 0 && <div className="admin-btn-text">Серий пока нет</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {episodeModal && savedId && activeSeason && (
        <EpisodeModal
          seasonId={activeSeason.id}
          episodeId={episodeModal.mode === "edit" ? episodeModal.episodeId! : undefined}
          defaultNumber={
            episodeModal.mode === "create"
              ? activeSeason.episodes.length
                ? Math.max(...activeSeason.episodes.map((e) => e.number)) + 1
                : 1
              : undefined
          }
          onClose={() => setEpisodeModal(null)}
          onSaved={() => {
            setEpisodeModal(null);
            if (savedId) loadFull(savedId);
          }}
        />
      )}

      {shareInfo && (
        <ShareModal
          watchUrl={`${window.location.origin}/title/${savedId}/episode/${shareInfo.episodeId}`}
          embedUrl={`${window.location.origin}/embed/${shareInfo.episodeId}`}
          onClose={() => setShareInfo(null)}
        />
      )}
    </div>
  );
}
