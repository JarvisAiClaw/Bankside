import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
export type SessionData = { userId?: string };
const options: SessionOptions = {
  password: process.env.SESSION_SECRET || "development-secret-change-me-32-characters",
  cookieName: "bankside_session",
  cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 }
};
export async function getSession() { return getIronSession<SessionData>(await cookies(), options); }
