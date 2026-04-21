import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { cache } from "@hono/hono/cache";
import { Redis } from "ioredis";
import postgres from "postgres";

const app = new Hono();
const sql = postgres();

let redis;
if (Deno.env.get("REDIS_HOST")) {
  redis = new Redis(
    Number.parseInt(Deno.env.get("REDIS_PORT")),
    Deno.env.get("REDIS_HOST"),
  );
} else {
  redis = new Redis(6379, "redis");
}

const QUEUE_NAME = "submissions";

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

app.post("/api/exercises/:id/submissions", async (c) => {
  const { source_code } = await c.req.json()
  const result = await sql`
    INSERT INTO exercise_submissions (exercise_id, source_code)
    VALUES (${c.req.param("id")}, ${source_code})
    RETURNING id
  `;
  const submission_id = result[0].id;
  await redis.lpush(QUEUE_NAME, submission_id);
  return c.json({ id: submission_id});
})

app.get("/api/exercises/:id", async (c) => {
  const exercises = await sql`
    SELECT id, title, description
    FROM exercises
    WHERE id = ${c.req.param("id")}
  `;

  if (exercises.length === 0) {
    return c.body(null, 404);
  }

  return c.json(exercises[0]);
});

app.get("/api/submissions/:id/status", async (c) => {
  const submissions = await sql`
    SELECT grading_status, grade
    FROM exercise_submissions
    WHERE id = ${c.req.param("id")}
  `;

  if (submissions.length === 0) {
    return c.body(null, 404);
  }

  c.header("Cache-Control", "no-store");
  return c.json(submissions[0]);
});

export default app;