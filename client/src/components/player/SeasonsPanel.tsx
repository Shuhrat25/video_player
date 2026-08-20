import { useState } from "react";
import type { Season } from "../../api/types";
import { formatTime } from "./formatTime";

interface SeasonsPanelProps {
  open: boolean;
  seasons: Season[];
  currentEpisodeId: number | null;
  onSelectEpisode: (episodeId: number) => void;
  onClose: () => void;
}

export default function SeasonsPanel({
  open,
  seasons,
  currentEpisodeId,
  onSelectEpisode,
  onClose,
}: SeasonsPanelProps) {
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(
    seasons.find((s) => s.episodes.some((e) => e.id === currentEpisodeId))?.id ??
      seasons[0]?.id ??
      null
  );

  const activeSeason = seasons.find((s) => s.id === activeSeasonId);

  return (
    <div className={"seasons-panel" + (open ? " open" : "")}>
      <div className="seasons-panel__header">
        <span>Сезоны и серии</span>
        <button onClick={onClose} aria-label="Закрыть">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="seasons-panel__tabs">
        {seasons.map((s) => (
          <button
            key={s.id}
            className={"seasons-panel__tab" + (s.id === activeSeasonId ? " active" : "")}
            onClick={() => setActiveSeasonId(s.id)}
          >
            {s.name || `Сезон ${s.number}`}
          </button>
        ))}
      </div>

      <div className="seasons-panel__episodes">
        {activeSeason?.episodes.map((ep) => (
          <button
            key={ep.id}
            className={"episode-row" + (ep.id === currentEpisodeId ? " active" : "")}
            onClick={() => onSelectEpisode(ep.id)}
          >
            <span className="episode-row__number">{ep.number}</span>
            <span className="episode-row__name">{ep.name || `Серия ${ep.number}`}</span>
            {ep.durationSeconds && (
              <span className="episode-row__duration">{formatTime(ep.durationSeconds)}</span>
            )}
          </button>
        ))}
        {!activeSeason?.episodes.length && (
          <div className="seasons-panel__empty">В этом сезоне пока нет серий</div>
        )}
      </div>
    </div>
  );
}
