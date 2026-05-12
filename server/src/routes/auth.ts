import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { query } from "../db/pool";
import { signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  keepLoggedIn: z.boolean().optional(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input" });
  const { email, password, keepLoggedIn } = parsed.data;

  const r = await query(
    `SELECT u.id, u.password_hash, u.role, u.restaurant_id, u.name, r.name AS restaurant_name
     FROM users u
     JOIN restaurants r ON r.id = u.restaurant_id
     WHERE u.email=$1 LIMIT 1`,
    [email]
  );
  const user = r.rows[0];
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const payload = { uid: user.id, rid: user.restaurant_id, role: user.role };
  res.json({
    user: { id: user.id, name: user.name, email, role: user.role },
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload, keepLoggedIn ? "30d" : "7d"),
    restaurantName: user.restaurant_name,
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const r = await query(
    `SELECT u.id, u.name, u.email, u.role, rest.name AS restaurant_name
     FROM users u JOIN restaurants rest ON rest.id = u.restaurant_id
     WHERE u.id=$1 AND u.restaurant_id=$2 LIMIT 1`,
    [req.auth!.uid, req.auth!.rid]
  );
  if (!r.rowCount) return res.status(404).json({ error: "not_found" });
  const row = r.rows[0];
  res.json({
    user: { id: row.id, name: row.name, email: row.email, role: row.role },
    restaurantName: row.restaurant_name,
  });
});

const pinSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });

authRouter.post("/verify-pin", requireAuth, async (req, res) => {
  const parsed = pinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input" });

  const r = await query(
    `SELECT owner_pin_hash FROM restaurants WHERE id=$1 LIMIT 1`,
    [req.auth!.rid]
  );
  if (!r.rowCount) return res.status(404).json({ error: "not_found" });

  const hash = r.rows[0].owner_pin_hash as string | null;
  // TODO: require owner to set a PIN during setup; while not yet
  // configured we treat any 4-digit PIN as valid so the manager flow
  // can be demoed end-to-end.
  if (!hash) return res.json({ ok: true });

  const ok = await bcrypt.compare(parsed.data.pin, hash);
  if (!ok) return res.status(401).json({ error: "invalid_pin" });
  res.json({ ok: true });
});

const googleSchema = z.object({ access_token: z.string().min(8) });

authRouter.post("/google", async (req, res) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input" });

  // Verify the access token against Google's userinfo endpoint.
  let userinfo: { email?: string; email_verified?: boolean; name?: string } | null = null;
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${parsed.data.access_token}` },
    });
    if (!r.ok) return res.status(401).json({ error: "invalid_google_token" });
    userinfo = await r.json();
  } catch {
    return res.status(502).json({ error: "google_unreachable" });
  }

  const email = userinfo?.email?.toLowerCase();
  if (!email) return res.status(400).json({ error: "no_email" });
  if (userinfo?.email_verified === false) {
    return res.status(401).json({ error: "email_not_verified" });
  }

  // Find a Once user by email. Per spec we only allow existing users
  // (typically the owner who registered) — no auto-provisioning.
  const r = await query(
    `SELECT u.id, u.name, u.role, u.restaurant_id, rest.name AS restaurant_name
     FROM users u JOIN restaurants rest ON rest.id = u.restaurant_id
     WHERE u.email = $1 LIMIT 1`,
    [email]
  );
  if (!r.rowCount) {
    return res.status(404).json({
      error: "no_once_account",
      message:
        "No Once account found for this Google account. Please register first.",
    });
  }

  const user = r.rows[0];
  const payload = { uid: user.id, rid: user.restaurant_id, role: user.role };
  res.json({
    user: { id: user.id, name: user.name, email, role: user.role },
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload, "7d"),
    restaurantName: user.restaurant_name,
  });
});

// One-shot Google identity check used during onboarding. Verifies the
// access token with Google, refuses if the email is already registered,
// and returns the raw Google profile (email + name + sub) so the wizard
// can pre-fill it. No JWT is issued — that happens after POST /setup
// completes with the full restaurant details.
authRouter.post("/google/register", async (req, res) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input" });

  let userinfo: {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  } | null = null;
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${parsed.data.access_token}` },
    });
    if (!r.ok) return res.status(401).json({ error: "invalid_google_token" });
    userinfo = await r.json();
  } catch {
    return res.status(502).json({ error: "google_unreachable" });
  }

  const email = userinfo?.email?.toLowerCase();
  const googleId = userinfo?.sub;
  const name = userinfo?.name ?? email?.split("@")[0] ?? "Owner";

  if (!email || !googleId) return res.status(400).json({ error: "no_email" });
  if (userinfo?.email_verified === false) {
    return res.status(401).json({ error: "email_not_verified" });
  }

  const existing = await query(
    `SELECT id FROM users WHERE email=$1 LIMIT 1`,
    [email]
  );
  if (existing.rowCount) {
    return res.status(409).json({
      error: "email_exists",
      message: "An account with this email already exists. Sign in instead.",
    });
  }

  res.json({ email, name, googleId });
});

authRouter.post("/refresh", (req, res) => {
  const token = req.body?.refreshToken as string | undefined;
  if (!token) return res.status(400).json({ error: "missing_token" });
  try {
    const p = verifyRefresh(token);
    res.json({ accessToken: signAccess({ uid: p.uid, rid: p.rid, role: p.role }) });
  } catch {
    res.status(401).json({ error: "invalid_refresh" });
  }
});

const forgotSchema = z.object({ email: z.string().email() });

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input" });
  const { email } = parsed.data;

  const r = await query(
    `SELECT id, restaurant_id FROM users WHERE email=$1 LIMIT 1`,
    [email]
  );
  if (r.rowCount) {
    const user = r.rows[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_reset_tokens (user_id, restaurant_id, token_hash, expires_at)
       VALUES ($1,$2,$3,$4)`,
      [user.id, user.restaurant_id, tokenHash, expiresAt]
    );

    // Email provider not configured — surface the reset URL in the server log.
    const resetUrl = `once://reset-password?token=${rawToken}`;
    console.log(
      `[forgot-password] user=${email} token=${rawToken.slice(0, 8)}… link=${resetUrl} expires=${expiresAt.toISOString()}`
    );
  }

  // Always return success to avoid exposing which emails are registered.
  res.json({ ok: true });
});
