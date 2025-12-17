import { defineEventHandler, readBody, createError } from "h3";
import { setMetaModel } from "../lib/providerRegistry";
import { requireAdmin } from "../utils/auth";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const body = await readBody<{ name?: string; model_ids?: string | number[] }>(event);
  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: "name is required" });
  }

  const normalizeIds = (value: string | number[]) => {
    if (Array.isArray(value)) return value.map(Number).filter((x) => !Number.isNaN(x));
    return (value ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((x) => !Number.isNaN(x));
  };

  const ids = normalizeIds(body.model_ids ?? []);

  setMetaModel(body.name, ids);
  return { ok: true, order: ids };
});
