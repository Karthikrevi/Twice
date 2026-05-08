import { Router } from "express";
import * as Sentry from "@sentry/node";
import { verifySignature } from "../lib/crypto";
import { env } from "../env";
import { webhookQueue } from "../queues";

export const webhooksRouter = Router();

interface PlatformConfig {
  header: string;
  secret: string;
  normalize: (body: any, restaurantId: string) => any;
}

const configs: Record<"talabat" | "deliveroo" | "instashop", PlatformConfig> = {
  talabat: {
    header: "x-talabat-signature",
    secret: env.webhookSecrets.talabat,
    normalize: (body, restaurantId) => ({
      restaurantId,
      platform: "talabat",
      externalId: String(body.order_id),
      shortId: `#TLB-${String(body.order_id).slice(-4)}`,
      customerName: body.customer?.name,
      address: body.delivery?.address,
      totalCents: Math.round(Number(body.total) * 100),
      specialInstructions: body.notes,
      items: (body.items ?? []).map((i: any) => ({
        name: i.name,
        qty: Number(i.quantity),
        priceCents: Math.round(Number(i.unit_price) * 100),
        menuItemId: i.menu_item_id,
      })),
    }),
  },
  deliveroo: {
    header: "x-deliveroo-hmac-sha256",
    secret: env.webhookSecrets.deliveroo,
    normalize: (body, restaurantId) => ({
      restaurantId,
      platform: "deliveroo",
      externalId: String(body.order.id),
      shortId: `#DLR-${String(body.order.id).slice(-4)}`,
      customerName: body.order.customer_name,
      address: body.order.delivery_address,
      totalCents: Math.round(Number(body.order.total_price) * 100),
      specialInstructions: body.order.notes,
      items: (body.order.items ?? []).map((i: any) => ({
        name: i.name,
        qty: Number(i.quantity),
        priceCents: Math.round(Number(i.price) * 100),
        menuItemId: i.pos_id,
      })),
    }),
  },
  instashop: {
    header: "x-instashop-signature",
    secret: env.webhookSecrets.instashop,
    normalize: (body, restaurantId) => ({
      restaurantId,
      platform: "instashop",
      externalId: String(body.id),
      shortId: `#INS-${String(body.id).slice(-4)}`,
      customerName: body.customer_name,
      address: body.address,
      totalCents: Math.round(Number(body.total) * 100),
      items: (body.line_items ?? []).map((i: any) => ({
        name: i.name,
        qty: Number(i.qty),
        priceCents: Math.round(Number(i.price) * 100),
        menuItemId: i.sku,
      })),
    }),
  },
};

(["talabat", "deliveroo", "instashop"] as const).forEach((platform) => {
  const cfg = configs[platform];
  webhooksRouter.post(`/${platform}/:restaurantId`, async (req, res) => {
    const signature = req.header(cfg.header) ?? "";
    const raw = (req as any).rawBody as string;
    if (!verifySignature(raw, signature, cfg.secret)) {
      Sentry.captureMessage(`webhook.invalid_signature.${platform}`, {
        tags: { kind: "platform-webhook", platform, restaurant_id: req.params.restaurantId },
      });
      return res.status(401).json({ error: "invalid_signature" });
    }
    try {
      const job = cfg.normalize(req.body, req.params.restaurantId);
      await webhookQueue.add(`${platform}:${job.externalId}`, job, {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      });
      res.json({ ok: true });
    } catch (e) {
      Sentry.captureException(e, {
        tags: { kind: "platform-webhook", platform, restaurant_id: req.params.restaurantId },
      });
      res.status(500).json({ error: "webhook_failed" });
    }
  });
});
