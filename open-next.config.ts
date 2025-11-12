import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // @ts-ignore - Forzar configuración experimental de R2
  cache: {
    type: "r2",
    binding: "CACHE_BUCKET",
  },
});
