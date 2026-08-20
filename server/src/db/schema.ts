import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Admins ----------
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Studios (озвучки) ----------
export const studios = pgTable("studios", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  logoUrl: text("logo_url"),
});

// ---------- Titles (тайтлы: фильм/сериал/аниме) ----------
export const titles = pgTable("titles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }),
  description: text("description"),
  posterUrlMobile: text("poster_url_mobile"),
  posterUrlDesktop: text("poster_url_desktop"),
  year: integer("year"),
  author: varchar("author", { length: 255 }),
  genres: text("genres").array(),
  totalEpisodes: integer("total_episodes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Related titles (самосвязь many-to-many с порядком) ----------
export const relatedTitles = pgTable(
  "related_titles",
  {
    id: serial("id").primaryKey(),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    relatedTitleId: integer("related_title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => ({
    uniquePair: uniqueIndex("related_titles_pair_idx").on(t.titleId, t.relatedTitleId),
  })
);

// ---------- Seasons (студия озвучки теперь привязана к сезону) ----------
export const seasons = pgTable(
  "seasons",
  {
    id: serial("id").primaryKey(),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    studioId: integer("studio_id").references(() => studios.id, { onDelete: "set null" }),
    number: integer("number").notNull(),
    name: varchar("name", { length: 120 }),
    position: integer("position").notNull().default(0),
  },
  (t) => ({
    titleSeasonUnique: uniqueIndex("season_title_number_idx").on(t.titleId, t.number),
  })
);

// ---------- Episodes ----------
export const episodes = pgTable(
  "episodes",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    name: varchar("name", { length: 255 }),
    durationSeconds: integer("duration_seconds"),
    posterUrl: text("poster_url"), // превью-кадр перед проигрыванием — обязателен в форме
    openingStart: integer("opening_start"),
    openingEnd: integer("opening_end"),
    endingStart: integer("ending_start"),
    endingEnd: integer("ending_end"),
  },
  (t) => ({
    seasonEpisodeUnique: uniqueIndex("episode_season_number_idx").on(t.seasonId, t.number),
  })
);

// ---------- Video sources (серия x качество -> ссылка; студия теперь на сезоне) ----------
export const videoQualityEnum = ["480p", "720p", "1080p"] as const;
export type VideoQuality = (typeof videoQualityEnum)[number];

export const videoSources = pgTable("video_sources", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  quality: varchar("quality", { length: 10 }).notNull(),
  url: text("url").notNull(),
});

// ---------- Subtitles ----------
export const subtitles = pgTable("subtitles", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 40 }).notNull(),
  url: text("url").notNull(),
});

// ---------- Relations ----------
export const titlesRelations = relations(titles, ({ many }) => ({
  seasons: many(seasons),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  title: one(titles, { fields: [seasons.titleId], references: [titles.id] }),
  studio: one(studios, { fields: [seasons.studioId], references: [studios.id] }),
  episodes: many(episodes),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  season: one(seasons, { fields: [episodes.seasonId], references: [seasons.id] }),
  videoSources: many(videoSources),
  subtitles: many(subtitles),
}));

export const videoSourcesRelations = relations(videoSources, ({ one }) => ({
  episode: one(episodes, { fields: [videoSources.episodeId], references: [episodes.id] }),
}));

export const studiosRelations = relations(studios, ({ many }) => ({
  seasons: many(seasons),
}));
