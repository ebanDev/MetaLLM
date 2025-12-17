import { defineEventHandler, createError } from "h3";
import { requireAdmin } from "../../utils/auth";
import { db } from "../../db";

export default defineEventHandler((event) => {
  requireAdmin(event);
  const idParam = event.context.params?.id;
  const id = idParam ? Number(idParam) : NaN;
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "model id is required" });
  }
  const result = db.prepare(`DELETE FROM models WHERE id = ?`).run(id);
  return { ok: true, deleted: result.changes };
});
