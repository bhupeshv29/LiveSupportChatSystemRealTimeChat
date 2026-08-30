import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/ws.types";

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, JWT_SECRET);

  if (typeof payload !== "object" || !payload.userId || !payload.role) {
    throw new Error("Invalid JWT payload");
  }

  return payload as JwtPayload;
}
