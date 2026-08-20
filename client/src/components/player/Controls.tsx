import { formatTime } from "./formatTime";
import ProgressBar from "./ProgressBar";

interface ControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  ccOn: boolean;
  settingsOpen: boolean;
  seasonsOpen: boolean;
  isMobile: boolean;
  sourceUrl: string | undefined;
  hasPrevEpisode: boolean;
  hasNextEpisode: boolean;
  onTogglePlay: () => void;
  onSeek: (fraction: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  onPrevEpisode: () => void;
  onNextEpisode: () => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onToggleCc: () => void;
  onToggleSettings: () => void;
  onToggleSeasons: () => void;
  onTogglePip: () => void;
  onToggleFullscreen: () => void;
  fullscreen: boolean;
}

export default function Controls({
  playing,
  currentTime,
  duration,
  bufferedPercent,
  volume,
  ccOn,
  settingsOpen,
  seasonsOpen,
  isMobile,
  sourceUrl,
  hasPrevEpisode,
  hasNextEpisode,
  onTogglePlay,
  onSeek,
  onScrubStart,
  onScrubEnd,
  onPrevEpisode,
  onNextEpisode,
  onVolumeChange,
  onToggleMute,
  onToggleCc,
  onToggleSettings,
  onToggleSeasons,
  onTogglePip,
  onToggleFullscreen,
  fullscreen,
}: ControlsProps) {
  const volumeIcon =
    volume === 0 ? "fa-volume-off" : volume <= 50 ? "fa-volume-low" : "fa-volume-high";

  return (
    <div className="bottom">
      <ProgressBar
        sourceUrl={sourceUrl}
        currentTime={currentTime}
        duration={duration}
        bufferedPercent={bufferedPercent}
        onSeek={onSeek}
        onScrubStart={onScrubStart}
        onScrubEnd={onScrubEnd}
      />

      <div className="control_btns">
        <div className="left_btns">
          <i
            className={"fa-solid fa-list" + (seasonsOpen ? " active" : "")}
            onClick={onToggleSeasons}
            title="Сезоны и серии"
          />
          {!isMobile && (
            <div className="volume">
              <i className={`fa-solid ${volumeIcon}`} onClick={onToggleMute} />
              <input
                className="volume_range"
                type="range"
                min={0}
                max={100}
                step={5}
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                style={{
                  background: `linear-gradient(90deg, #fff ${volume}%, #ffffff87 ${volume}%)`,
                }}
              />
            </div>
          )}
        </div>

        <div className="center_btns">
          <div className="current_time time">{formatTime(currentTime)}</div>
          <i
            className={"fa-solid fa-backward-step" + (hasPrevEpisode ? "" : " disabled")}
            onClick={hasPrevEpisode ? onPrevEpisode : undefined}
            title="Предыдущая серия"
          />
          <i
            className={"fa-solid " + (playing ? "fa-pause" : "fa-play")}
            onClick={onTogglePlay}
          />
          <i
            className={"fa-solid fa-forward-step" + (hasNextEpisode ? "" : " disabled")}
            onClick={hasNextEpisode ? onNextEpisode : undefined}
            title="Следующая серия"
          />
          <div className="duration_time time">{formatTime(duration)}</div>
        </div>

        <div className="right_btns">
          <i className="material-symbols-outlined" onClick={onTogglePip}>
            picture_in_picture_alt
          </i>
          <i
            className={(ccOn ? "fa-solid" : "fa-regular") + " fa-closed-captioning"}
            onClick={onToggleCc}
          />
          <i
            className={"fa-solid fa-gear" + (settingsOpen ? " active" : "")}
            onClick={onToggleSettings}
          />
          <i
            className={"fa-solid " + (fullscreen ? "fa-compress" : "fa-expand")}
            onClick={onToggleFullscreen}
          />
        </div>
      </div>
    </div>
  );
}
