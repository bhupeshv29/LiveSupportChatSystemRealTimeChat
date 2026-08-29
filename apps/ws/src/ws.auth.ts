import "dotenv/config";
import jwt from "jsonwebtoken";

import type { Role } from "@repo/db/client";

interface JWTPayload {
  userId: string;
  userRole: Role;
}

const JWT_SECRET = process.env.JWT_SECRET;

export function authenticateToken(token: string): JWTPayload {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("userId" in decoded) ||
    !("userRole" in decoded)
  ) {
    throw new Error("Invalid token");
  }

  return {
    userId: decoded.userId as string,
    userRole: decoded.userRole as Role,
  };
}
