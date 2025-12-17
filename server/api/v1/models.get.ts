import { defineEventHandler } from "h3";
import { listActiveMetaModels } from "../../lib/providerRegistry";

export default defineEventHandler(() => {
  const metas = listActiveMetaModels();

  const metaMap: Record<
    string,
    { id: string; object: "model"; owned_by: string; type: "meta"; targets: string[] }
  > = {};
  metas.forEach((row) => {
    if (!metaMap[row.meta]) {
      metaMap[row.meta] = {
        id: row.meta,
        object: "model",
        owned_by: "meta-router",
        type: "meta",
        targets: [],
      };
    }
    metaMap[row.meta].targets.push(`${row.provider_id}:${row.name}`);
  });

  return {
    object: "list",
    data: Object.values(metaMap),
  };
});
