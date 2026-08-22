import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    // Decode token and look for EITHER userId or sub
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = decoded.userId || decoded.sub;
    req.userEmail = decoded.email;
    
    if (!req.userId) return res.status(401).json({ message: "Invalid token payload" });
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
