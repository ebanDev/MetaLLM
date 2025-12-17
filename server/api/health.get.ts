import { defineEventHandler } from "h3";

export default defineEventHandler(() => ({
  ok: true,
  now: new Date().toISOString(),
}));
