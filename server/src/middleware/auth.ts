import type { NextFunction, Request, Response } from "express";
import { verifyAccess, type TokenPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "missing_token" });
  try {
    req.auth = verifyAccess(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function requireRole(...roles: TokenPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "missing_token" });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: "forbidden" });
    next();
  };
}
