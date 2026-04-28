import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { Redis } from "ioredis";
import postgres from "postgres";
import { levenshteinDistance } from "./grader-utils.js";

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

let consume_enabled = false;
const QUEUE_NAME = "submissions";

app.use("/*", cors());
app.use("/*", logger());

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}


async function startGradingLoop() {
    while (consume_enabled) {
        const queue_size = await redis.llen(QUEUE_NAME);

        if(queue_size == 0){
            await sleep(250);
        }
        else{
            const result = await redis.brpop(QUEUE_NAME, 0);
            const [queue, result_id] = result;
            const id = JSON.parse(result_id);
            await sql`
                UPDATE exercise_submissions
                SET grading_status = 'processing'
                WHERE id = ${id}
            `;
            
            const grading_period = getRandomInt(1,3) * 1000;
            await sleep(grading_period);

            const submissionRows = await sql`
                SELECT source_code, exercise_id
                FROM exercise_submissions
                WHERE id = ${id}
            `;
            const submissionCode = submissionRows[0].source_code;
            const exerciseId = submissionRows[0].exercise_id;

            const exerciseRows = await sql`
                SELECT solution_code
                FROM exercises
                WHERE id = ${exerciseId}
            `;
            const solutionCode = exerciseRows[0].solution_code;

            const distance = levenshteinDistance(submissionCode, solutionCode);
            const maxLen = Math.max(submissionCode.length, solutionCode.length);
            let grade;
            if (maxLen === 0) {
                grade = 100;
            } else {
                grade = Math.ceil(100 * (1 - (distance / maxLen)));
            }
            await sql`
                UPDATE exercise_submissions
                SET grading_status = 'graded',
                    grade = ${grade}
                WHERE id = ${id}
            `;
        }
    
    }
}

app.get("/api/status", async (c) => {
  const queue_size = await redis.llen(QUEUE_NAME);
  return c.json({ 
    "queue_size": queue_size,
    "consume_enabled": consume_enabled 
  });
});

app.post("/api/consume/enable", async (c) => {
    if (!consume_enabled) {
        consume_enabled = true;
        startGradingLoop();
    }
    return c.json({"consume_enabled": true})
})

app.post("/api/consume/disable", async (c) => {
    consume_enabled = false;
    return c.json({"consume_enabled": false})
})

export default app;