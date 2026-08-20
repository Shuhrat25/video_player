import { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../utils/jwt.js";

export interface AuthedRequest extends Request {
  admin?: { adminId: number; email: string };
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Нет токена авторизации" });
  }

  try {
    const token = header.slice("Bearer ".length);
    req.admin = verifyAdminToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Токен недействителен или истёк" });
  }
}
