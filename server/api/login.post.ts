import { defineEventHandler, readBody, setCookie, createError } from "h3";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const { adminToken } = useRuntimeConfig();
  if (!adminToken) {
    throw createError({ statusCode: 400, statusMessage: "ADMIN_TOKEN not configured" });
  }
  const body = await readBody<{ token?: string }>(event);
  if (!body?.token || body.token !== adminToken) {
    throw createError({ statusCode: 401, statusMessage: "Invalid token" });
  }
  setCookie(event, "admin_token", body.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
});
