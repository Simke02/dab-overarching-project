import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { cache } from "@hono/hono/cache";
import postgres from "postgres";

const app = new Hono();
const sql = postgres();

app.use("/*", cors());
app.use("/*", logger());

app.get(
  "/api/languages",
  cache({
    cacheName: "languages-cache",
    wait: true,
  }),
);
app.get("/api/languages", async (c) => {
  const languages = await sql`SELECT * FROM languages`;
  return c.json(languages);
});

app.get(
  "/api/languages/*",
  cache({
    cacheName: "exercises-cache",
    wait: true,
  }),
);
app.get(
  "/api/languages/:id/exercises",
  async (c) => {
    const exercises = await sql`
        SELECT id, title, description
        FROM exercises
        WHERE language_id = ${c.req.param("id")}
    `;
    return c.json(exercises);
  },
);

export default app;