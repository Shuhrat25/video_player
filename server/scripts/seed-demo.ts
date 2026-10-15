import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { titles, seasons, episodes, videoSources } from "../src/db/schema.js";

async function main() {
  if (process.env.DEMO_SEED !== "true") return;
  const name = "Video Player — демонстрация";
  const existing = await db.select({ id: titles.id }).from(titles).where(eq(titles.name, name));
  if (existing.length) return;
  await db.transaction(async tx => {
    const [title] = await tx.insert(titles).values({ name, description: "Синтетический тестовый ролик для проверки управления плеером. Создан средствами FFmpeg, без сторонних видео.", posterUrlMobile: "/demo/poster.svg", posterUrlDesktop: "/demo/poster.svg", year: 2026, genres: ["Демонстрация"], totalEpisodes: 1 }).returning();
    const [season] = await tx.insert(seasons).values({ titleId: title.id, number: 1, name: "Проверка плеера", position: 0 }).returning();
    const [episode] = await tx.insert(episodes).values({ seasonId: season.id, number: 1, name: "Цвет, движение и звук", durationSeconds: 8, posterUrl: "/demo/poster.svg" }).returning();
    await tx.insert(videoSources).values({ episodeId: episode.id, quality: "720p", url: "/demo/demo.mp4" });
  });
  console.log("Synthetic demo title created.");
}
main().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
