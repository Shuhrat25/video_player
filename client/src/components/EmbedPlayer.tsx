import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { EpisodeDetail } from "../api/types";

export default function EmbedPlayer() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);

  useEffect(() => {
    if (!episodeId) return;
    api.getEpisode(Number(episodeId)).then(setEpisode);
  }, [episodeId]);

  if (!episode) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#000" }} />
    );
  }

  const best = [...episode.sources].sort((a, b) => (a.quality > b.quality ? -1 : 1))[0];

  return (
    <video
      src={best?.url}
      poster={episode.posterUrl || undefined}
      controls
      autoPlay
      style={{ width: "100vw", height: "100vh", background: "#000", display: "block" }}
    >
      {episode.subtitles.map((s) => (
        <track key={s.id} kind="subtitles" src={s.url} srcLang={s.language} label={s.language} />
      ))}
    </video>
  );
}
