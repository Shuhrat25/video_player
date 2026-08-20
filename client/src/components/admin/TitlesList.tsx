import { useEffect, useState } from "react";
import { api, adminResource } from "../../api/client";
import type { Title } from "../../api/types";
import KebabMenu from "./KebabMenu";
import ShareModal from "./ShareModal";

interface TitlesListProps {
  onAdd: () => void;
  onEdit: (titleId: number) => void;
}

export default function TitlesList({ onAdd, onEdit }: TitlesListProps) {
  const [query, setQuery] = useState("");
  const [titles, setTitles] = useState<Title[]>([]);
  const [shareInfo, setShareInfo] = useState<{ titleId: number; episodeId: number | null } | null>(null);

  async function reload() {
    const all = query.trim() ? await api.search(query) : await api.listTitles();
    setTitles(all as Title[]);
  }

  useEffect(() => {
    const t = setTimeout(reload, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleShare(titleId: number) {
    const full = await api.getTitle(titleId);
    const firstEpisode = full.seasons[0]?.episodes[0];
    setShareInfo({ titleId, episodeId: firstEpisode?.id ?? null });
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить тайтл вместе со всеми сезонами и сериями?")) return;
    await adminResource("titles").remove(id);
    reload();
  }

  return (
    <div>
      <div className="admin-topbar">
        <div className="admin-topbar__title">Тайтлы</div>
        <div className="admin-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            placeholder="Поиск по названию..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="admin-btn-primary" onClick={onAdd}>
          + Добавить
        </button>
      </div>

      <div className="title-list">
        {titles.map((t) => (
          <div key={t.id} className="title-row" onClick={() => onEdit(t.id)}>
            {t.posterUrlMobile ? (
              <img className="title-row__poster" src={t.posterUrlMobile} alt="" />
            ) : (
              <div className="title-row__poster" />
            )}
            <div>
              <div className="title-row__name">{t.name}</div>
              <div className="title-row__meta">
                {t.year ?? "—"}
                {t.totalEpisodes ? ` · ${t.totalEpisodes} эп.` : ""}
              </div>
            </div>
            <div className="title-row__spacer" />
            <KebabMenu
              onShare={() => handleShare(t.id)}
              onEdit={() => onEdit(t.id)}
              onDelete={() => handleDelete(t.id)}
            />
          </div>
        ))}
        {titles.length === 0 && <div className="admin-btn-text">Пока ничего не найдено</div>}
      </div>

      {shareInfo && (
        <ShareModal
          watchUrl={
            shareInfo.episodeId
              ? `${window.location.origin}/title/${shareInfo.titleId}/episode/${shareInfo.episodeId}`
              : `${window.location.origin}/title/${shareInfo.titleId}`
          }
          embedUrl={`${window.location.origin}/embed/${shareInfo.episodeId ?? ""}`}
          onClose={() => setShareInfo(null)}
        />
      )}
    </div>
  );
}
