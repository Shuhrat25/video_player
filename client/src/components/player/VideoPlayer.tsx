import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { Title, EpisodeDetail, VideoQuality, EpisodeSummary } from "../../api/types";
import TopBar from "./TopBar";
import Controls from "./Controls";
import SeasonsPanel from "./SeasonsPanel";
import SettingsPanel, { PlayerToggles } from "./SettingsPanel";
import InfoPanel from "./InfoPanel";
import PlayerShareModal from "./PlayerShareModal";
import { loadProgress, saveProgress, loadPlayerSettings, savePlayerSettings } from "../../lib/playerProgress";
import "./VideoPlayer.css";

const MOBILE_QUERY = "(max-width: 720px)";

export default function VideoPlayer() {
  const { titleId, episodeId: episodeIdParam } = useParams<{ titleId: string; episodeId?: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastSaveRef = useRef(0);
  const skippedOpeningRef = useRef<number | null>(null);
  const skippedEndingRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ side: "left" | "right"; time: number } | null>(null);
  const singleTapTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [title, setTitle] = useState<Title | null>(null);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<number | null>(null);
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [resumeTime, setResumeTime] = useState<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<VideoQuality | null>(null);
  const [subtitleLanguage, setSubtitleLanguage] = useState<string | null>(null);
  const [ccOn, setCcOn] = useState(true);
  const [toggles, setToggles] = useState<PlayerToggles>(loadPlayerSettings());

  const [seasonsOpen, setSeasonsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [tapFlash, setTapFlash] = useState<{ side: "left" | "right"; key: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ---- Загрузка тайтла: если есть сохранённый прогресс — открываем ту серию, иначе первую ----
  useEffect(() => {
    if (!titleId) return;
    api.getTitle(Number(titleId)).then((t) => {
      setTitle(t);

      if (episodeIdParam) {
        setCurrentEpisodeId(Number(episodeIdParam));
        return;
      }

      const saved = loadProgress(t.id);
      const savedEpisodeExists =
        saved && t.seasons.some((s) => s.episodes.some((e) => e.id === saved.episodeId));

      if (saved && savedEpisodeExists) {
        setCurrentEpisodeId(saved.episodeId);
        setResumeTime(saved.time);
      } else {
        const firstEpisode = t.seasons[0]?.episodes[0];
        if (firstEpisode) setCurrentEpisodeId(firstEpisode.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleId]);

  // ---- Загрузка серии ----
  useEffect(() => {
    if (!currentEpisodeId) return;
    setLoading(true);
    skippedOpeningRef.current = null;
    skippedEndingRef.current = null;
    api.getEpisode(currentEpisodeId).then((ep) => {
      setEpisode(ep);
      setLoading(false);
    });
  }, [currentEpisodeId]);

  const currentSeason = useMemo(
    () => title?.seasons.find((s) => s.episodes.some((e) => e.id === currentEpisodeId)) ?? null,
    [title, currentEpisodeId]
  );

  const availableQualities = useMemo<VideoQuality[]>(() => {
    if (!episode) return [];
    return Array.from(new Set(episode.sources.map((s) => s.quality)));
  }, [episode]);

  useEffect(() => {
    if (availableQualities.length && !availableQualities.includes(quality as VideoQuality)) {
      setQuality(availableQualities[availableQualities.length - 1]);
    }
  }, [availableQualities]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSource = useMemo(
    () => episode?.sources.find((s) => s.quality === quality) || null,
    [episode, quality]
  );

  const subtitleLanguages = useMemo(() => episode?.subtitles.map((s) => s.language) ?? [], [episode]);
  const activeSubtitleTrack = episode?.subtitles.find((s) => s.language === subtitleLanguage);

  function findNextEpisode(): EpisodeSummary | null {
    if (!title || !episode || !currentSeason) return null;
    const inSeason = [...currentSeason.episodes].sort((a, b) => a.number - b.number);
    const idx = inSeason.findIndex((e) => e.id === episode.id);
    if (idx >= 0 && idx < inSeason.length - 1) return inSeason[idx + 1];

    const seasonsSorted = [...title.seasons].sort((a, b) => a.position - b.position);
    const sIdx = seasonsSorted.findIndex((s) => s.id === currentSeason.id);
    for (let i = sIdx + 1; i < seasonsSorted.length; i++) {
      const first = [...seasonsSorted[i].episodes].sort((a, b) => a.number - b.number)[0];
      if (first) return first;
    }
    return null;
  }

  function findPrevEpisode(): EpisodeSummary | null {
    if (!title || !episode || !currentSeason) return null;
    const inSeason = [...currentSeason.episodes].sort((a, b) => a.number - b.number);
    const idx = inSeason.findIndex((e) => e.id === episode.id);
    if (idx > 0) return inSeason[idx - 1];

    const seasonsSorted = [...title.seasons].sort((a, b) => a.position - b.position);
    const sIdx = seasonsSorted.findIndex((s) => s.id === currentSeason.id);
    for (let i = sIdx - 1; i >= 0; i--) {
      const eps = [...seasonsSorted[i].episodes].sort((a, b) => a.number - b.number);
      if (eps.length) return eps[eps.length - 1];
    }
    return null;
  }

  const nextEpisode = useMemo(findNextEpisode, [title, episode, currentSeason]);
  const prevEpisode = useMemo(findPrevEpisode, [title, episode, currentSeason]);

  // ---- Видео-события ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episode) return;

    const onTimeUpdate = () => {
      const t = video.currentTime;
      setCurrentTime(t);

      if (toggles.skipOpening && episode.openingStart != null && episode.openingEnd != null) {
        if (t >= episode.openingStart && t < episode.openingEnd && skippedOpeningRef.current !== episode.id) {
          video.currentTime = episode.openingEnd;
          skippedOpeningRef.current = episode.id;
        }
      }
      if (toggles.skipEnding && episode.endingStart != null && episode.endingEnd != null) {
        if (t >= episode.endingStart && t < episode.endingEnd && skippedEndingRef.current !== episode.id) {
          video.currentTime = episode.endingEnd;
          skippedEndingRef.current = episode.id;
        }
      }

      if (title && Date.now() - lastSaveRef.current > 4000) {
        lastSaveRef.current = Date.now();
        saveProgress(title.id, { episodeId: episode.id, time: t });
      }
    };

    const onLoadedMeta = () => {
      setDuration(video.duration || 0);
      if (resumeTime && resumeTime < (video.duration || Infinity) - 2) {
        video.currentTime = resumeTime;
      }
      setResumeTime(null);
    };

    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration) {
        setBufferedPercent((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      if (title) saveProgress(title.id, { episodeId: episode.id, time: video.currentTime });
    };
    const onEnded = () => {
      if (title) saveProgress(title.id, { episodeId: episode.id, time: 0 });
      if (toggles.autoplay && nextEpisode) setCurrentEpisodeId(nextEpisode.id);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMeta);
    video.addEventListener("progress", onProgress);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMeta);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSource, episode, toggles, nextEpisode]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  function handleToggleChange(key: keyof PlayerToggles, value: boolean) {
    setToggles((prev) => {
      const next = { ...prev, [key]: value };
      savePlayerSettings(next);
      return next;
    });
  }

  // ---- Автоскрытие контролов ----
  const showControls = useCallback(() => {
    setControlsHidden(false);
    clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      if (!videoRef.current?.paused && !scrubbing) setControlsHidden(true);
    }, 3000);
  }, [scrubbing]);

  useEffect(() => {
    showControls();
    return () => clearTimeout(hideTimeout.current);
  }, [showControls]);

  function goToEpisode(ep: EpisodeSummary) {
    setCurrentEpisodeId(ep.id);
    if (title) navigate(`/title/${title.id}/episode/${ep.id}`, { replace: true });
  }

  // ---- Клавиатура: play/pause, перемотка, громкость, полноэкранный режим — как в YouTube ----
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video || !duration) return;

      if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === "Space" || e.code === "KeyK") {
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        video.currentTime -= 5;
      } else if (e.code === "ArrowRight") {
        video.currentTime += 5;
      } else if (e.code === "KeyJ") {
        video.currentTime -= 10;
      } else if (e.code === "KeyL") {
        video.currentTime += 10;
      } else if (e.code === "ArrowUp") {
        setVolume((v) => Math.min(100, v + 5));
      } else if (e.code === "ArrowDown") {
        setVolume((v) => Math.max(0, v - 5));
      } else if (e.code === "KeyM") {
        toggleMute();
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "KeyC") {
        setCcOn((v) => !v);
      } else if (/^Digit[0-9]$/.test(e.code)) {
        const n = Number(e.code.replace("Digit", ""));
        video.currentTime = (n / 10) * duration;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // ---- Сохраняем прогресс перед закрытием вкладки ----
  useEffect(() => {
    function onUnload() {
      if (title && episode && videoRef.current) {
        saveProgress(title.id, { episodeId: episode.id, time: videoRef.current.currentTime });
      }
    }
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [title, episode]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  }

  function pauseIfPlaying() {
    if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
  }

  function handleSeek(fraction: number) {
    if (videoRef.current) videoRef.current.currentTime = fraction * duration;
  }

  function toggleMute() {
    setVolume((v) => (v > 0 ? 0 : 80));
  }

  // ---- Полноэкранный режим + принудительный поворот экрана на мобильных ----
  async function toggleFullscreen() {
    if (!containerRef.current) return;
    const orientation = (screen as any).orientation;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setFullscreen(true);
      if (isMobile && orientation?.lock) {
        orientation.lock("landscape").catch(() => {
          // iOS Safari и некоторые браузеры не поддерживают программный поворот экрана
        });
      }
    } else {
      if (orientation?.unlock) orientation.unlock();
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }

  function togglePip() {
    videoRef.current?.requestPictureInPicture().catch(() => {});
  }

  function selectEpisode(episodeId: number) {
    const all = title?.seasons.flatMap((s) => s.episodes) ?? [];
    const ep = all.find((e) => e.id === episodeId);
    if (ep) goToEpisode(ep);
    setSeasonsOpen(false);
  }

  // ---- Двойной тап по краям — перемотка ±10с (мобильный жест) ----
  function handleEdgeTap(side: "left" | "right") {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && last.side === side && now - last.time < 350) {
      clearTimeout(singleTapTimeout.current);
      lastTapRef.current = null;
      if (videoRef.current) {
        videoRef.current.currentTime += side === "left" ? -10 : 10;
      }
      setTapFlash({ side, key: now });
      setTimeout(() => setTapFlash(null), 600);
    } else {
      lastTapRef.current = { side, time: now };
      clearTimeout(singleTapTimeout.current);
      singleTapTimeout.current = setTimeout(() => {
        togglePlay();
        lastTapRef.current = null;
      }, 350);
    }
  }

  if (!title) {
    return <div className="player-loading">Загрузка...</div>;
  }

  return (
    <div
      className={"control_box" + (controlsHidden ? " hide" : "") + (playing ? " pause" : "")}
      ref={containerRef}
      onMouseMove={showControls}
      onMouseLeave={() => !videoRef.current?.paused && !scrubbing && setControlsHidden(true)}
      onContextMenu={(e) => {
        e.preventDefault();
        setSettingsOpen(true);
      }}
    >
      {loading && (
        <div className="spinner" style={{ display: "flex" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 40 }} />
        </div>
      )}

      <video
        id="main_video"
        ref={videoRef}
        src={currentSource?.url}
        poster={episode?.posterUrl || title.posterUrlDesktop || undefined}
        onClick={togglePlay}
      >
        {activeSubtitleTrack && ccOn && (
          <track
            kind="subtitles"
            src={activeSubtitleTrack.url}
            srcLang={activeSubtitleTrack.language}
            label={activeSubtitleTrack.language}
            default
          />
        )}
      </video>

      {/* Зоны двойного тапа для перемотки на мобильных; одиночный тап — play/pause */}
      {isMobile && (
        <>
          <div
            className="dtap-zone dtap-zone--left"
            onClick={() => handleEdgeTap("left")}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEdgeTap("left");
            }}
          />
          <div
            className="dtap-zone dtap-zone--right"
            onClick={() => handleEdgeTap("right")}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEdgeTap("right");
            }}
          />
          {tapFlash && (
            <div key={tapFlash.key} className={`dtap-flash dtap-flash--${tapFlash.side}`}>
              <i className={`fa-solid fa-${tapFlash.side === "left" ? "backward" : "forward"}`} /> 10с
            </div>
          )}
        </>
      )}

      <TopBar
        title={title}
        currentStudioName={currentSeason?.studioName ?? null}
        onInfoClick={() => {
          pauseIfPlaying();
          setInfoOpen(true);
        }}
        onShareClick={() => {
          pauseIfPlaying();
          setShareOpen(true);
        }}
      />

      <div className="center playPauseMainBtn" onClick={togglePlay}>
        <i className={"fa-solid " + (playing ? "fa-pause" : "fa-play")} />
      </div>

      <Controls
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        bufferedPercent={bufferedPercent}
        volume={volume}
        ccOn={ccOn}
        settingsOpen={settingsOpen}
        seasonsOpen={seasonsOpen}
        isMobile={isMobile}
        sourceUrl={currentSource?.url}
        hasPrevEpisode={!!prevEpisode}
        hasNextEpisode={!!nextEpisode}
        fullscreen={fullscreen}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onScrubStart={() => setScrubbing(true)}
        onScrubEnd={() => setScrubbing(false)}
        onPrevEpisode={() => prevEpisode && goToEpisode(prevEpisode)}
        onNextEpisode={() => nextEpisode && goToEpisode(nextEpisode)}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onToggleCc={() => setCcOn((v) => !v)}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        onToggleSeasons={() => setSeasonsOpen((v) => !v)}
        onTogglePip={togglePip}
        onToggleFullscreen={toggleFullscreen}
      />

      <SettingsPanel
        open={settingsOpen}
        speed={speed}
        onSpeedChange={setSpeed}
        qualities={availableQualities}
        quality={quality}
        onQualityChange={setQuality}
        subtitleLanguages={subtitleLanguages}
        subtitleLanguage={subtitleLanguage}
        onSubtitleLanguageChange={setSubtitleLanguage}
        toggles={toggles}
        onToggleChange={handleToggleChange}
      />

      <SeasonsPanel
        open={seasonsOpen}
        seasons={title.seasons}
        currentEpisodeId={currentEpisodeId}
        onSelectEpisode={selectEpisode}
        onClose={() => setSeasonsOpen(false)}
      />

      {infoOpen && <InfoPanel title={title} onClose={() => setInfoOpen(false)} />}

      {shareOpen && episode && (
        <PlayerShareModal
          baseWatchUrl={`${window.location.origin}/title/${title.id}/episode/${episode.id}`}
          baseEmbedUrl={`${window.location.origin}/embed/${episode.id}`}
          currentTime={currentTime}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
