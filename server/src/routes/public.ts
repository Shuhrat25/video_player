import { Router } from "express";
import { db } from "../db/index.js";
import {
  titles,
  seasons,
  episodes,
  studios,
  videoSources,
  subtitles,
  relatedTitles,
} from "../db/schema.js";
import { eq, ilike, inArray } from "drizzle-orm";

export const publicRouter = Router();

// GET /api/titles — список всех тайтлов (каталог)
publicRouter.get("/titles", async (_req, res) => {
  const rows = await db.select().from(titles).orderBy(titles.name);
  res.json(rows);
});

// GET /api/titles/:id — тайтл + сезоны (со студией) + серии + related
publicRouter.get("/titles/:id", async (req, res) => {
  const titleId = Number(req.params.id);
  const [title] = await db.select().from(titles).where(eq(titles.id, titleId));
  if (!title) return res.status(404).json({ error: "Тайтл не найден" });

  const titleSeasons = await db
    .select({
      id: seasons.id,
      titleId: seasons.titleId,
      number: seasons.number,
      name: seasons.name,
      position: seasons.position,
      studioId: seasons.studioId,
      studioName: studios.name,
    })
    .from(seasons)
    .leftJoin(studios, eq(seasons.studioId, studios.id))
    .where(eq(seasons.titleId, titleId))
    .orderBy(seasons.position, seasons.number);

  const seasonIds = titleSeasons.map((s) => s.id);
  const titleEpisodes = seasonIds.length
    ? await db
        .select()
        .from(episodes)
        .where(inArray(episodes.seasonId, seasonIds))
        .orderBy(episodes.number)
    : [];

  const relatedRows = await db
    .select({
      id: relatedTitles.id,
      position: relatedTitles.position,
      relatedTitleId: relatedTitles.relatedTitleId,
      name: titles.name,
      posterUrlMobile: titles.posterUrlMobile,
      posterUrlDesktop: titles.posterUrlDesktop,
      year: titles.year,
    })
    .from(relatedTitles)
    .innerJoin(titles, eq(relatedTitles.relatedTitleId, titles.id))
    .where(eq(relatedTitles.titleId, titleId))
    .orderBy(relatedTitles.position);

  res.json({
    ...title,
    related: relatedRows,
    seasons: titleSeasons.map((season) => ({
      ...season,
      episodes: titleEpisodes.filter((e) => e.seasonId === season.id),
    })),
  });
});

// GET /api/search?q=...
publicRouter.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  const rows = await db.select().from(titles).where(ilike(titles.name, `%${q}%`)).limit(20);
  res.json(rows);
});

// GET /api/studios
publicRouter.get("/studios", async (_req, res) => {
  const rows = await db.select().from(studios).orderBy(studios.name);
  res.json(rows);
});

// GET /api/episodes/:id — источники видео + субтитры + таймкоды опенинга/эндинга
publicRouter.get("/episodes/:id", async (req, res) => {
  const episodeId = Number(req.params.id);
  const [episode] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
  if (!episode) return res.status(404).json({ error: "Серия не найдена" });

  const sources = await db
    .select()
    .from(videoSources)
    .where(eq(videoSources.episodeId, episodeId));

  const episodeSubtitles = await db
    .select()
    .from(subtitles)
    .where(eq(subtitles.episodeId, episodeId));

  res.json({ ...episode, sources, subtitles: episodeSubtitles });
});
