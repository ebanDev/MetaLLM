import { defineEventHandler, createError } from "h3";
import { requireAdmin } from "../../utils/auth";
import { db } from "../../db";

export default defineEventHandler((event) => {
  requireAdmin(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "provider id is required" });
  }
  const result = db.prepare(`DELETE FROM providers WHERE id = ?`).run(id);
  return { ok: true, deleted: result.changes };
});
