import { defineEventHandler, getRouterParam } from "h3";
import { deleteMetaModel } from "../../lib/providerRegistry";
import { requireAdmin } from "../../utils/auth";

export default defineEventHandler((event) => {
  requireAdmin(event);
  const name = getRouterParam(event, "name");
  if (!name) {
    return { ok: false, error: "name is required" };
  }
  deleteMetaModel(name);
  return { ok: true };
});
