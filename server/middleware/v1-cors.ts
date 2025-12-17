import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  const url = event.node.req.url || "";
  if (!url.startsWith("/api/v1")) return;

  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  setHeader(event, "Access-Control-Allow-Credentials", "true");

  if (event.node.req.method === "OPTIONS") {
    event.node.res.statusCode = 204;
    event.node.res.end();
  }
});
