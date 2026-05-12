import * as Print from "expo-print";
import { platformLabel, type PlatformKey } from "@/theme/colors";

const RECEIPT_WIDTH_PX = 302; // 80mm thermal at ~96 DPI

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtDateTime = (d: Date) =>
  d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtMoney = (cents: number) => `AED ${(cents / 100).toFixed(2)}`;

const baseStyle = `
  <style>
    @page { margin: 0; }
    body {
      width: ${RECEIPT_WIDTH_PX}px;
      max-width: ${RECEIPT_WIDTH_PX}px;
      margin: 0;
      padding: 16px;
      background: #ffffff;
      color: #000000;
      font-family: 'Menlo', 'Consolas', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.45;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .italic { font-style: italic; }
    .row { display: flex; justify-content: space-between; align-items: baseline; }
    .row span:last-child { white-space: nowrap; }
    .divider { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    .thick { border-top: 2px solid #000; margin: 8px 0; }
    .small { font-size: 10px; }
    .xl { font-size: 18px; }
    .lg { font-size: 14px; }
    .note {
      border: 1px solid #000;
      padding: 6px 8px;
      margin: 8px 0;
    }
    h1, h2, h3 { margin: 0; }
  </style>
`;

// ---------- printBill ----------

export interface BillItem {
  name: string;
  qty: number;
  priceCents: number;
}

export interface BillContext {
  restaurantName: string;
  location?: string;
  items: BillItem[];
  guests: number;
  splitType: "even" | "item";
  paymentMethod: "cash" | "card" | "wallet";
  tableName?: string;
}

export async function printBill(ctx: BillContext): Promise<void> {
  const total = ctx.items.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const perGuestCents = ctx.guests > 0 ? Math.round(total / ctx.guests) : total;
  const now = new Date();
  const splitLine =
    ctx.splitType === "even" && ctx.guests > 0
      ? `
        <div class="row"><span>Split ${ctx.guests} way${ctx.guests === 1 ? "" : "s"}</span><span></span></div>
        <div class="row bold"><span>Per guest</span><span>${fmtMoney(perGuestCents)}</span></div>
      `
      : `
        <div class="row"><span>Split by item</span><span></span></div>
      `;

  const html = `
    <html>
      <head><meta charset="utf-8"/>${baseStyle}</head>
      <body>
        <div class="center bold xl">${escape(ctx.restaurantName)}</div>
        ${ctx.location ? `<div class="center">${escape(ctx.location)}</div>` : ""}
        <div class="center small">${fmtDateTime(now)}</div>
        ${ctx.tableName ? `<div class="center small">Table ${escape(ctx.tableName)}</div>` : ""}
        <hr class="divider"/>

        ${ctx.items
          .map(
            (it) => `
              <div class="row">
                <span>${it.qty} × ${escape(it.name)}</span>
                <span>${fmtMoney(it.priceCents * it.qty)}</span>
              </div>
            `
          )
          .join("")}

        <hr class="divider"/>
        <div class="row bold"><span>Subtotal</span><span>${fmtMoney(total)}</span></div>

        ${splitLine}

        <hr class="divider"/>
        <div class="row"><span>Payment</span><span>${ctx.paymentMethod.toUpperCase()}</span></div>

        <div class="center italic" style="margin-top:14px">Thank you!</div>
        <div class="center small" style="margin-top:14px">Once · ${fmtDateTime(now)}</div>
      </body>
    </html>
  `;

  await Print.printAsync({ html });
}

// ---------- printKitchenTicket ----------

export interface KitchenTicketContext {
  restaurantName: string;
  shortId: string;
  platform: PlatformKey;
  placedAt: string;
  items: { name: string; qty: number; notes?: string }[];
  specialInstructions?: string;
  tableName?: string;
  customerName?: string;
  deliveryAddress?: string;
}

export async function printKitchenTicket(ctx: KitchenTicketContext): Promise<void> {
  const placed = new Date(ctx.placedAt);
  const isDelivery =
    ctx.platform === "talabat" ||
    ctx.platform === "deliveroo" ||
    ctx.platform === "instashop";

  const html = `
    <html>
      <head><meta charset="utf-8"/>${baseStyle}</head>
      <body>
        <div class="center bold xl">${escape(platformLabel[ctx.platform].toUpperCase())}</div>
        <div class="center lg">${escape(ctx.shortId)}</div>
        <div class="center small">${fmtDateTime(placed)}</div>
        <hr class="thick"/>

        ${ctx.items
          .map(
            (it) => `
              <div class="row" style="margin-bottom:4px">
                <span class="bold xl">${it.qty}× ${escape(it.name)}</span>
              </div>
            `
          )
          .join("")}

        ${
          ctx.specialInstructions
            ? `<div class="note bold">NOTE: ${escape(ctx.specialInstructions)}</div>`
            : ""
        }

        ${
          ctx.tableName
            ? `<div class="bold lg" style="margin-top:8px">Table ${escape(ctx.tableName)}</div>`
            : isDelivery
            ? `
                ${ctx.customerName ? `<div class="bold">${escape(ctx.customerName)}</div>` : ""}
                ${
                  ctx.deliveryAddress
                    ? `<div>${escape(ctx.deliveryAddress)}</div>`
                    : ""
                }
              `
            : ctx.customerName
            ? `<div class="bold">${escape(ctx.customerName)}</div>`
            : ""
        }

        <hr class="divider"/>
        <div class="center small">Once Kitchen</div>
      </body>
    </html>
  `;

  await Print.printAsync({ html });
}

// ---------- printDailyReport ----------

export interface DailyReportContext {
  restaurantName: string;
  date: Date;
  byPlatform: {
    platform: PlatformKey;
    grossCents: number;
    commissionCents: number;
    netCents: number;
    rate: number;
  }[];
  tills: { cash?: number; card?: number; wallet?: number };
}

export async function printDailyReport(ctx: DailyReportContext): Promise<void> {
  const gross = ctx.byPlatform.reduce((s, r) => s + r.grossCents, 0);
  const commission = ctx.byPlatform.reduce((s, r) => s + r.commissionCents, 0);
  const net = gross - commission;

  const dateLabel = ctx.date.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const rows = ctx.byPlatform
    .map(
      (r) => `
        <div class="row">
          <span>${escape(platformLabel[r.platform])}</span>
          <span>${fmtMoney(r.grossCents)}</span>
        </div>
        <div class="row small">
          <span>${r.rate ? `${Math.round(r.rate * 100)}% commission` : "Direct"}</span>
          <span>${r.rate ? `-${fmtMoney(r.commissionCents)}` : "no fee"}</span>
        </div>
        <div class="row small">
          <span>Net</span>
          <span class="bold">${fmtMoney(r.netCents)}</span>
        </div>
        <hr class="divider"/>
      `
    )
    .join("");

  const html = `
    <html>
      <head><meta charset="utf-8"/>${baseStyle}</head>
      <body>
        <div class="center bold xl">${escape(ctx.restaurantName)}</div>
        <div class="center bold lg">Daily Report</div>
        <div class="center small">${dateLabel}</div>
        <hr class="thick"/>

        <div class="bold">Revenue</div>
        <div class="row"><span>Gross</span><span class="bold">${fmtMoney(gross)}</span></div>
        <div class="row"><span>Commission</span><span>-${fmtMoney(commission)}</span></div>
        <div class="row"><span>Net</span><span class="bold">${fmtMoney(net)}</span></div>
        <hr class="divider"/>

        <div class="bold">By Channel</div>
        ${rows || `<div class="small">No channel revenue today.</div>`}

        <div class="bold">Till</div>
        <div class="row"><span>Cash</span><span>${fmtMoney(ctx.tills.cash ?? 0)}</span></div>
        <div class="row"><span>Card</span><span>${fmtMoney(ctx.tills.card ?? 0)}</span></div>
        <div class="row"><span>Wallet</span><span>${fmtMoney(ctx.tills.wallet ?? 0)}</span></div>

        <hr class="divider"/>
        <div class="center small">Once · ${fmtDateTime(new Date())}</div>
      </body>
    </html>
  `;

  await Print.printAsync({ html });
}
