import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env";

export interface TokenPayload {
  uid: string;
  rid: string;
  role: "owner" | "manager" | "waiter" | "kitchen";
}

export const signAccess = (p: TokenPayload) =>
  jwt.sign(p, env.jwtSecret, { expiresIn: "15m" });

export const signRefresh = (p: TokenPayload, expiresIn: SignOptions["expiresIn"] = "7d") =>
  jwt.sign(p, env.jwtRefreshSecret, { expiresIn });

export const verifyAccess = (t: string) => jwt.verify(t, env.jwtSecret) as TokenPayload;
export const verifyRefresh = (t: string) => jwt.verify(t, env.jwtRefreshSecret) as TokenPayload;
