import { defineEventHandler, readBody, createError } from "h3";
import { requireAdmin } from "../utils/auth";
import { upsertSearchProvider } from "../lib/searchRegistry";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const body = await readBody<{
    id?: string;
    display_name?: string;
    base_url?: string;
    api_key?: string;
    priority?: number | string;
    active?: number | string;
    per_minute?: number | string;
    per_hour?: number | string;
    per_day?: number | string;
    per_month?: number | string;
  }>(event);

  if (!body?.id || !body?.base_url) {
    throw createError({ statusCode: 400, statusMessage: "id and base_url are required" });
  }

  upsertSearchProvider({
    id: body.id,
    display_name: body.display_name ?? null,
    base_url: body.base_url,
    api_key: body.api_key ?? null,
    priority: Number(body.priority ?? 0),
    active: Number(body.active ?? 1),
    per_minute: body.per_minute ? Number(body.per_minute) : null,
    per_hour: body.per_hour ? Number(body.per_hour) : null,
    per_day: body.per_day ? Number(body.per_day) : null,
    per_month: body.per_month ? Number(body.per_month) : null,
  });

  return { ok: true };
});
