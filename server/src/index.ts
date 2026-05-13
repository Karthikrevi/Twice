import http from "node:http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { setupRouter } from "./routes/setup";
import { ordersRouter } from "./routes/orders";
import { menuRouter } from "./routes/menu";
import { tablesRouter } from "./routes/tables";
import { reportsRouter } from "./routes/reports";
import { staffRouter } from "./routes/staff";
import { platformsRouter } from "./routes/platforms";
import { webhooksRouter } from "./routes/webhooks";
import { privacyRouter } from "./routes/privacy";
import { initSocket } from "./realtime/io";
import { startWorkers, scheduleRecurringJobs } from "./queues";

if (env.sentryDsn) {
  Sentry.init({ dsn: env.sentryDsn, tracesSampleRate: 0.1 });
}

const app = express();

app.use(cors());
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString("utf8");
    },
  })
);

app.use(
  rateLimit({ windowMs: 60_000, max: 240, standardHeaders: true, legacyHeaders: false })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/setup", setupRouter);
app.use("/orders", ordersRouter);
app.use("/menu", menuRouter);
app.use("/tables", tablesRouter);
app.use("/reports", reportsRouter);
app.use("/staff", staffRouter);
app.use("/platforms", platformsRouter);
app.use("/privacy", privacyRouter);
app.use(
  "/webhooks",
  rateLimit({ windowMs: 60_000, max: 600, standardHeaders: true, legacyHeaders: false }),
  webhooksRouter
);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  Sentry.captureException(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "server_error" });
});

const server = http.createServer(app);
initSocket(server);
startWorkers();
scheduleRecurringJobs().catch((err) => {
  Sentry.captureException(err);
  console.error("[scheduleRecurringJobs]", err);
});

server.listen(env.port, () => {
  console.log(`Once API listening on :${env.port}`);
});
