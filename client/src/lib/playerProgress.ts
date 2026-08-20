export interface WatchProgress {
  episodeId: number;
  time: number;
}

const progressKey = (titleId: number) => `player-progress:${titleId}`;

export function loadProgress(titleId: number): WatchProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(titleId));
    return raw ? (JSON.parse(raw) as WatchProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(titleId: number, progress: WatchProgress) {
  try {
    localStorage.setItem(progressKey(titleId), JSON.stringify(progress));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — молча игнорируем
  }
}

export interface PlayerSettings {
  autoplay: boolean;
  skipOpening: boolean;
  skipEnding: boolean;
}

const SETTINGS_KEY = "player-settings";

const DEFAULT_SETTINGS: PlayerSettings = {
  autoplay: true,
  skipOpening: false,
  skipEnding: false,
};

export function loadPlayerSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function savePlayerSettings(settings: PlayerSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
