import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
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
import { requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

function crud<T extends Record<string, any>>(
  router: Router,
  path: string,
  table: any,
  createSchema: z.ZodType<T>,
  updateSchema: z.ZodType<Partial<T>>
) {
  router.get(path, async (_req, res) => {
    res.json(await db.select().from(table));
  });

  router.post(path, async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [row] = await db.insert(table).values(parsed.data).returning();
    res.status(201).json(row);
  });

  router.put(`${path}/:id`, async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [row] = await db
      .update(table)
      .set(parsed.data)
      .where(eq(table.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Не найдено" });
    res.json(row);
  });

  router.delete(`${path}/:id`, async (req, res) => {
    await db.delete(table).where(eq(table.id, Number(req.params.id)));
    res.status(204).end();
  });
}

// ---- Тайтлы ----
crud(
  adminRouter,
  "/titles",
  titles,
  z.object({
    name: z.string().min(1),
    originalName: z.string().optional(),
    description: z.string().optional(),
    posterUrlMobile: z.string().url().optional(),
    posterUrlDesktop: z.string().url().optional(),
    year: z.number().int().optional(),
    author: z.string().optional(),
    genres: z.array(z.string()).optional(),
    totalEpisodes: z.number().int().optional(),
  }),
  z.object({
    name: z.string().min(1).optional(),
    originalName: z.string().optional(),
    description: z.string().optional(),
    posterUrlMobile: z.string().url().optional(),
    posterUrlDesktop: z.string().url().optional(),
    year: z.number().int().optional(),
    author: z.string().optional(),
    genres: z.array(z.string()).optional(),
    totalEpisodes: z.number().int().optional(),
  })
);

// ---- Сезоны (с привязкой студии и позицией для drag-reorder) ----
crud(
  adminRouter,
  "/seasons",
  seasons,
  z.object({
    titleId: z.number().int(),
    studioId: z.number().int().optional(),
    number: z.number().int(),
    name: z.string().optional(),
    position: z.number().int().optional(),
  }),
  z.object({
    titleId: z.number().int().optional(),
    studioId: z.number().int().optional(),
    number: z.number().int().optional(),
    name: z.string().optional(),
    position: z.number().int().optional(),
  })
);

// PUT /api/admin/seasons/reorder — массовое обновление порядка после drag&drop
adminRouter.put("/seasons/reorder", async (req, res) => {
  const parsed = z.array(z.object({ id: z.number().int(), position: z.number().int() })).safeParse(
    req.body
  );
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  await Promise.all(
    parsed.data.map((item) =>
      db.update(seasons).set({ position: item.position }).where(eq(seasons.id, item.id))
    )
  );
  res.json({ ok: true });
});

// ---- Серии (с таймкодами опенинга/эндинга и обложкой) ----
crud(
  adminRouter,
  "/episodes",
  episodes,
  z.object({
    seasonId: z.number().int(),
    number: z.number().int(),
    name: z.string().optional(),
    durationSeconds: z.number().int().optional(),
    posterUrl: z.string().url(),
    openingStart: z.number().int().optional(),
    openingEnd: z.number().int().optional(),
    endingStart: z.number().int().optional(),
    endingEnd: z.number().int().optional(),
  }),
  z.object({
    seasonId: z.number().int().optional(),
    number: z.number().int().optional(),
    name: z.string().optional(),
    durationSeconds: z.number().int().optional(),
    posterUrl: z.string().url().optional(),
    openingStart: z.number().int().optional(),
    openingEnd: z.number().int().optional(),
    endingStart: z.number().int().optional(),
    endingEnd: z.number().int().optional(),
  })
);

// ---- Студии озвучки ----
crud(
  adminRouter,
  "/studios",
  studios,
  z.object({ name: z.string().min(1), logoUrl: z.string().url().optional() }),
  z.object({ name: z.string().min(1).optional(), logoUrl: z.string().url().optional() })
);

// ---- Источники видео (серия x качество) ----
crud(
  adminRouter,
  "/video-sources",
  videoSources,
  z.object({
    episodeId: z.number().int(),
    quality: z.enum(["480p", "720p", "1080p"]),
    url: z.string().url(),
  }),
  z.object({
    episodeId: z.number().int().optional(),
    quality: z.enum(["480p", "720p", "1080p"]).optional(),
    url: z.string().url().optional(),
  })
);

// ---- Субтитры ----
crud(
  adminRouter,
  "/subtitles",
  subtitles,
  z.object({
    episodeId: z.number().int(),
    language: z.string().min(1),
    url: z.string().url(),
  }),
  z.object({
    episodeId: z.number().int().optional(),
    language: z.string().min(1).optional(),
    url: z.string().url().optional(),
  })
);

// ---- Связанные тайтлы ----
crud(
  adminRouter,
  "/related-titles",
  relatedTitles,
  z.object({
    titleId: z.number().int(),
    relatedTitleId: z.number().int(),
    position: z.number().int().optional(),
  }),
  z.object({
    titleId: z.number().int().optional(),
    relatedTitleId: z.number().int().optional(),
    position: z.number().int().optional(),
  })
);
