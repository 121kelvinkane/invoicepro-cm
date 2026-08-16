import jwt from "jsonwebtoken";

// Guaranteed to be a string, falling back to a hardcoded secret if env is missing
const JWT_SECRET: string = process.env.JWT_SECRET || "invoicepro-ultra-secret-hardcoded-key-12345";

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  // Using 'as unknown as' to satisfy TypeScript's strict type checking
  return jwt.verify(token, JWT_SECRET) as unknown as AuthTokenPayload;
}