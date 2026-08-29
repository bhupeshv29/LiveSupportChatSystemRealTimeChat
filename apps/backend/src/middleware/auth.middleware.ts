import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/config";

interface Decode extends JwtPayload {
  userId: string;
  userRole: string;
}

export default function AuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader?.startsWith("Bearer ")) {
      return res.json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token!, JWT_SECRET as string) as Decode;

    req.userId = decoded.userId;
    req.role = decoded.userRole;

    next();
  } catch (error) {
    console.log(error);
    res.json({ message: "invalid or expired token" });
  }
}

// (candidate, supervisor)
export const RequiredRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.role)) {
      return res.json({ message: "Forbidden" });
    }

    next();
  };
};
