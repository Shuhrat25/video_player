import { useState } from "react";
import type { VideoQuality } from "../../api/types";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export interface PlayerToggles {
  autoplay: boolean;
  skipOpening: boolean;
  skipEnding: boolean;
}

interface SettingsPanelProps {
  open: boolean;
  speed: number;
  onSpeedChange: (speed: number) => void;
  qualities: VideoQuality[];
  quality: VideoQuality | null;
  onQualityChange: (q: VideoQuality) => void;
  subtitleLanguages: string[];
  subtitleLanguage: string | null;
  onSubtitleLanguageChange: (lang: string | null) => void;
  toggles: PlayerToggles;
  onToggleChange: (key: keyof PlayerToggles, value: boolean) => void;
}

type View = "root" | "speed" | "quality" | "subtitles";

export default function SettingsPanel({
  open,
  speed,
  onSpeedChange,
  qualities,
  quality,
  onQualityChange,
  subtitleLanguages,
  subtitleLanguage,
  onSubtitleLanguageChange,
  toggles,
  onToggleChange,
}: SettingsPanelProps) {
  const [view, setView] = useState<View>("root");

  if (!open) return null;

  return (
    <div className="setting_panel show">
      {view === "root" && (
        <div className="control_panel show">
          <ul>
            <li onClick={() => setView("speed")}>
              <span>Скорость</span>
              <span className="icon">
                <span className="speed_value">{speed === 1 ? "Обычная" : `${speed}x`}</span>
                <i className="fa-solid fa-chevron-right" />
              </span>
            </li>
            {qualities.length > 0 && (
              <li onClick={() => setView("quality")}>
                <span>Качество</span>
                <span className="icon">
                  <span className="speed_value">{quality || "Авто"}</span>
                  <i className="fa-solid fa-chevron-right" />
                </span>
              </li>
            )}
            {subtitleLanguages.length > 0 && (
              <li onClick={() => setView("subtitles")}>
                <span>Субтитры</span>
                <span className="icon">
                  <span className="speed_value">{subtitleLanguage || "Выкл"}</span>
                  <i className="fa-solid fa-chevron-right" />
                </span>
              </li>
            )}
          </ul>

          <div className="settings-divider" />

          <ul>
            <ToggleRow
              label="Автовоспроизведение"
              checked={toggles.autoplay}
              onChange={(v) => onToggleChange("autoplay", v)}
            />
            <ToggleRow
              label="Пропускать опенинг"
              checked={toggles.skipOpening}
              onChange={(v) => onToggleChange("skipOpening", v)}
            />
            <ToggleRow
              label="Пропускать эндинг"
              checked={toggles.skipEnding}
              onChange={(v) => onToggleChange("skipEnding", v)}
            />
          </ul>
        </div>
      )}

      {view === "speed" && (
        <div className="panel show">
          <h4>
            <i className="fa-solid fa-angle-left" onClick={() => setView("root")} />
            Скорость
          </h4>
          <ul>
            {SPEEDS.map((s) => (
              <li key={s} className={s === speed ? "active" : ""} onClick={() => onSpeedChange(s)}>
                {s === 1 ? "Обычная" : s}
                {s === speed && <i className="fa-solid fa-check" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === "quality" && (
        <div className="panel show">
          <h4>
            <i className="fa-solid fa-angle-left" onClick={() => setView("root")} />
            Качество
          </h4>
          <ul>
            {qualities.map((q) => (
              <li key={q} className={q === quality ? "active" : ""} onClick={() => onQualityChange(q)}>
                {q}
                {q === quality && <i className="fa-solid fa-check" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === "subtitles" && (
        <div className="panel show">
          <h4>
            <i className="fa-solid fa-angle-left" onClick={() => setView("root")} />
            Субтитры
          </h4>
          <ul>
            <li className={subtitleLanguage === null ? "active" : ""} onClick={() => onSubtitleLanguageChange(null)}>
              Выключены
              {subtitleLanguage === null && <i className="fa-solid fa-check" />}
            </li>
            {subtitleLanguages.map((lang) => (
              <li
                key={lang}
                className={lang === subtitleLanguage ? "active" : ""}
                onClick={() => onSubtitleLanguageChange(lang)}
              >
                {lang}
                {lang === subtitleLanguage && <i className="fa-solid fa-check" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <span className={"toggle-switch" + (checked ? " on" : "")}>
        <span className="toggle-switch__knob" />
      </span>
    </li>
  );
}
