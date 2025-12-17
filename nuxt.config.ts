import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["@nuxt/ui"],
  app: {
    head: {
      htmlAttrs: { lang: "en" },
    },
  },
  runtimeConfig: {
    adminToken: process.env.ADMIN_TOKEN || "",
    public: {
      adminProtected: !!process.env.ADMIN_TOKEN,
    },
  },
  colorMode: {
    preference: "light",
    fallback: "light",
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  devtools: { enabled: false },
  css: ['~/assets/css/main.css']
});
