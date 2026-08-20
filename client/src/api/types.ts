export interface Studio {
  id: number;
  name: string;
  logoUrl: string | null;
}

export interface EpisodeSummary {
  id: number;
  seasonId: number;
  number: number;
  name: string | null;
  durationSeconds: number | null;
  posterUrl: string | null;
  openingStart: number | null;
  openingEnd: number | null;
  endingStart: number | null;
  endingEnd: number | null;
}

export interface Season {
  id: number;
  titleId: number;
  number: number;
  name: string | null;
  position: number;
  studioId: number | null;
  studioName: string | null;
  episodes: EpisodeSummary[];
}

export interface RelatedTitleEntry {
  id: number;
  position: number;
  relatedTitleId: number;
  name: string;
  posterUrlMobile: string | null;
  posterUrlDesktop: string | null;
  year: number | null;
}

export interface Title {
  id: number;
  name: string;
  originalName: string | null;
  description: string | null;
  posterUrlMobile: string | null;
  posterUrlDesktop: string | null;
  year: number | null;
  author: string | null;
  genres: string[] | null;
  totalEpisodes: number | null;
  related: RelatedTitleEntry[];
  seasons: Season[];
}

export type VideoQuality = "480p" | "720p" | "1080p";

export interface VideoSource {
  id: number;
  quality: VideoQuality;
  url: string;
}

export interface Subtitle {
  id: number;
  language: string;
  url: string;
}

export interface EpisodeDetail extends EpisodeSummary {
  sources: VideoSource[];
  subtitles: Subtitle[];
}
