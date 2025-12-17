import { H3Event, getCookie, getHeader, createError } from "h3";
import { useRuntimeConfig } from "#imports";

const tokenMatches = (token: string | undefined | null, expected: string) =>
  !!expected && !!token && token === expected;

export const requireAdmin = (event: H3Event) => {
  const { adminToken } = useRuntimeConfig();
  if (!adminToken) return; // no auth configured
  const headerToken = getHeader(event, "authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  const xHeader = getHeader(event, "x-admin-token")?.trim();
  const cookieToken = getCookie(event, "admin_token");
  if (
    tokenMatches(headerToken, adminToken) ||
    tokenMatches(xHeader, adminToken) ||
    tokenMatches(cookieToken, adminToken)
  ) {
    return;
  }
  throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
};
