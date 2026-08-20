import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/db/index.js";
import { admins } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Укажи ADMIN_EMAIL и ADMIN_PASSWORD в .env перед запуском сида");
  }

  const [existing] = await db.select().from(admins).where(eq(admins.email, email));
  if (existing) {
    console.log(`Админ ${email} уже существует, пропускаю`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(admins).values({ email, passwordHash });
  console.log(`Создан администратор: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
