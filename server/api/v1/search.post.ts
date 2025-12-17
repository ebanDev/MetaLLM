import {
  defineEventHandler,
  readBody,
  getRequestHeader,
  createError,
  setResponseStatus,
  setResponseHeader,
} from "h3";
import { createError, defineEventHandler, getRequestHeader, readBody, setResponseHeader, setResponseStatus } from "h3";
import { activeSearchProviders } from "../../lib/searchRegistry";
import { isSearchRateLimited, recordSearchRequest } from "../../lib/searchRateLimiter";

const searchPath = "/search";

const buildUrl = (baseUrl: string) => {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}${searchPath}`;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event);
  const providers = activeSearchProviders();
  if (!providers.length) {
    throw createError({ statusCode: 404, statusMessage: "No active search providers" });
  }

  let chosen = null;
  let lastLimit: { retryAfter?: number } | null = null;

  for (const p of providers) {
    const rate = isSearchRateLimited(p.id, {
      per_minute: p.per_minute,
      per_hour: p.per_hour,
      per_day: p.per_day,
      per_month: p.per_month,
    });
    if (rate.ok) {
      chosen = p;
      break;
    }
    lastLimit = rate;
  }

  if (!chosen) {
    setResponseStatus(event, 429);
    return { error: "Rate limit exceeded for all search providers", retry_after_seconds: lastLimit?.retryAfter };
  }

  const url = buildUrl(chosen.base_url);
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const incomingAuth = getRequestHeader(event, "authorization");
  const authHeader = chosen.api_key ? `Bearer ${chosen.api_key}` : incomingAuth;
  if (authHeader) headers.authorization = authHeader;

  let upstream;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: `Upstream request failed: ${err?.message}` });
  }

  const text = await upstream.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  // Count request for provider
  recordSearchRequest(chosen.id);

  setResponseStatus(event, upstream.status);
  upstream.headers.forEach((value, key) => {
    setResponseHeader(event, key, value);
  });

  return data;
});
