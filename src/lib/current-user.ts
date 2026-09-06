import { cache } from "react";
import { db } from "./db";
import { getSession } from "./auth";
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session.userId ? db.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, email: true, role: true } }) : null;
});
