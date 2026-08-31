import jwt from "jsonwebtoken";
import type { JwtPayload, Role } from "../types/ws.types";

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, JWT_SECRET);

  if (typeof payload !== "object" || payload === null || !("userId" in payload)) {
    throw new Error("Invalid JWT payload");
  }

  const decoded = payload as { userId: string; role?: string; userRole?: string };
  const role = (decoded.role ?? decoded.userRole) as Role | undefined;

  if (!decoded.userId || !role) {
    throw new Error("Invalid JWT payload");
  }

  return { userId: decoded.userId, role };
}
