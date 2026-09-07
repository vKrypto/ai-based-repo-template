import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const SESSION_COOKIE_NAME = "bb_session";
const SESSION_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

declare module "express-serve-static-core" {
  interface Request {
    sessionToken: string;
  }
}

export function attachSessionToken(req: Request, res: Response, next: NextFunction): void {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const existingToken = cookies?.[SESSION_COOKIE_NAME];
  const token = typeof existingToken === "string" && existingToken.length > 0 ? existingToken : randomUUID();

  if (token !== existingToken) {
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE_MS,
      path: "/"
    });
  }

  req.sessionToken = token;
  next();
}
