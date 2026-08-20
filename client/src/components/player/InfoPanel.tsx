import type { Title } from "../../api/types";

interface InfoPanelProps {
  title: Title;
  onClose: () => void;
}

export default function InfoPanel({ title, onClose }: InfoPanelProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>О тайтле</span>
          <button onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="info-panel">
          {title.posterUrlMobile && <img src={title.posterUrlMobile} alt={title.name} />}
          <div>
            <div style={{ fontFamily: "var(--display-font)", fontSize: 24, marginBottom: 6 }}>
              {title.name}
            </div>
            {title.originalName && (
              <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 8 }}>
                {title.originalName}
              </div>
            )}
            <div className="info-panel__meta">
              {[
                title.year,
                title.author,
                title.totalEpisodes ? `${title.totalEpisodes} эп.` : null,
                title.genres?.length ? title.genres.join(", ") : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
            <div className="info-panel__desc">{title.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
