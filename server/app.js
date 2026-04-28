import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { cache } from "@hono/hono/cache";
import { Redis } from "ioredis";
import { auth } from "./auth.js";
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

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));
app.use("/*", cors());
app.use("/*", logger());

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return next();
  }

  c.set("user", session.user.name);
  c.set("user_id", session.user.id);
  return next();
});

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


app.use("/api/exercises/:id/submissions", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  return next();
});

app.post("/api/exercises/:id/submissions", async (c) => {
  const user_id = c.get("user_id");
  const { source_code } = await c.req.json()
  const result = await sql`
    INSERT INTO exercise_submissions (exercise_id, source_code, user_id)
    VALUES (${c.req.param("id")}, ${source_code}, ${user_id})
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

app.use("/api/submissions/:id/status", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  return next();
});

app.get("/api/submissions/:id/status", async (c) => {
  const user_id = c.get("user_id");
  const submissions = await sql`
    SELECT grading_status, grade, user_id
    FROM exercise_submissions
    WHERE id = ${c.req.param("id")}
  `;

  if (submissions.length === 0) {
    return c.body(null, 404);
  }

  if(submissions[0].user_id != user_id) {
    c.status(404);
    return c.json({ message: "Unauthorized" });
  }

  const { user_id: _, ...response } = submissions[0];

  c.header("Cache-Control", "no-store");
  return c.json(response);
});

export default app;