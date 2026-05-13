import { Queue, Worker, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import * as Sentry from "@sentry/node";
import { env } from "../env";

const connection: ConnectionOptions = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

export const webhookQueue = new Queue("webhooks", { connection });
export const webhookDLQ = new Queue("webhooks:dlq", { connection });
export const platformSyncQueue = new Queue("platform-sync", { connection });
export const dataRetentionQueue = new Queue("data-retention", { connection });

export function startWorkers() {
  new Worker(
    "webhooks",
    async (job) => {
      const { handler } = await import("./handlers/webhookHandler");
      await handler(job.data);
    },
    { connection }
  ).on("failed", async (job, err) => {
    Sentry.captureException(err, {
      tags: {
        kind: "webhook",
        platform: job?.data?.platform,
        restaurant_id: job?.data?.restaurantId,
        order_id: job?.data?.externalId,
      },
    });
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await webhookDLQ.add("dead", job.data);
    }
  });

  new Worker(
    "platform-sync",
    async (job) => {
      const { syncAvailability } = await import("./handlers/platformSync");
      await syncAvailability(job.data);
    },
    { connection }
  ).on("failed", (job, err) => {
    Sentry.captureException(err, {
      tags: {
        kind: "platform-sync",
        platform: job?.data?.platform,
        restaurant_id: job?.data?.restaurantId,
      },
    });
  });

  new Worker(
    "data-retention",
    async () => {
      const { runDataRetention } = await import("../jobs/dataRetention");
      await runDataRetention();
    },
    { connection }
  ).on("failed", (_job, err) => {
    Sentry.captureException(err, { tags: { kind: "data-retention" } });
  });
}

/**
 * Schedule the daily retention sweep. Idempotent — re-adding a
 * Repeatable with the same jobId just bumps its options.
 */
export async function scheduleRecurringJobs() {
  await dataRetentionQueue.add(
    "daily-retention",
    {},
    {
      jobId: "daily-retention",
      repeat: { pattern: "0 3 * * *" }, // 03:00 every day
      removeOnComplete: 50,
      removeOnFail: 50,
    }
  );
}
