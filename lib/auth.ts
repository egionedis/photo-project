import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";

function buildToken(): string {
  return createHmac("sha256", env.adminPassword).update("photography-admin").digest("hex");
}

export function createAdminSessionToken(): string {
  return buildToken();
}

export function isValidAdminSessionToken(token: string): boolean {
  const expected = Buffer.from(buildToken(), "utf8");
  const incoming = Buffer.from(token, "utf8");
  if (expected.length !== incoming.length) {
    return false;
  }
  return timingSafeEqual(expected, incoming);
}

export async function getAdminSessionFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getAdminSessionFromCookies();
  return token ? isValidAdminSessionToken(token) : false;
}
